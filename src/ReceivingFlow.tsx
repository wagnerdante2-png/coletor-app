import { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Check, ChevronRight, ClipboardCheck, Clock3, FileCheck2, ImagePlus, MapPin, PackageCheck, ScanLine, ShieldCheck, Truck, UserRound, X } from 'lucide-react';

type Props = { lastCode: string; onScan: () => void };
type Step = 'arrival' | 'start' | 'conference' | 'summary';
type Occurrence = { type: string; description: string; photoName?: string };

const expectedPallets = ['PLT-001', 'PLT-002', 'PLT-003', 'PLT-004', 'PLT-005', 'PLT-006', 'PLT-007', 'PLT-008'];

export default function ReceivingFlow({ lastCode, onScan }: Props) {
  const [step, setStep] = useState<Step>('arrival');
  const [plate, setPlate] = useState('');
  const [driver, setDriver] = useState('');
  const [seal, setSeal] = useState('');
  const [dock, setDock] = useState('Doca 02');
  const [sealOk, setSealOk] = useState(true);
  const [arrivalTime, setArrivalTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [nfReleased, setNfReleased] = useState(false);
  const [receivedPallets, setReceivedPallets] = useState<string[]>(['PLT-001','PLT-002','PLT-003','PLT-004','PLT-005']);
  const [sampling, setSampling] = useState<string[]>(['PLT-004']);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [occurrenceOpen, setOccurrenceOpen] = useState(false);
  const [occType, setOccType] = useState('Avaria');
  const [occDescription, setOccDescription] = useState('');
  const [occPhoto, setOccPhoto] = useState('');

  const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const pending = expectedPallets.filter((p) => !receivedPallets.includes(p));
  const progress = Math.round((receivedPallets.length / expectedPallets.length) * 100);
  const duration = useMemo(() => {
    if (!startTime || !endTime) return 'Em andamento';
    const [sh, sm] = startTime.split(':').map(Number); const [eh, em] = endTime.split(':').map(Number);
    const mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  }, [startTime, endTime]);

  const confirmArrival = () => {
    if (!plate.trim() || !driver.trim() || !seal.trim()) return;
    setArrivalTime(now());
    setStep('start');
  };

  const startReceiving = () => { setStartTime(now()); setStep('conference'); };

  const simulatePalletRead = () => {
    const next = pending[0];
    if (!next) return;
    setReceivedPallets((current) => [...current, next]);
    if (next === 'PLT-007') setSampling((current) => [...current, next]);
  };

  const saveOccurrence = () => {
    if (!occDescription.trim()) return;
    setOccurrences((current) => [...current, { type: occType, description: occDescription.trim(), photoName: occPhoto || undefined }]);
    setOccDescription(''); setOccPhoto(''); setOccurrenceOpen(false);
  };

  const finishReceiving = () => { setEndTime(now()); setStep('summary'); };

  return <div className="receiving-flow">
    <section className="module-hero accent-green receiving-hero">
      <div className="module-hero-title"><span className="module-icon"><PackageCheck size={24}/></span><div><span className="eyebrow">RECEBIMENTO GUIADO</span><h1>{step === 'arrival' ? 'Identificar veículo' : step === 'start' ? 'Liberar e iniciar' : step === 'conference' ? 'Conferência em andamento' : 'Recebimento concluído'}</h1></div></div>
      <p>Fluxo simples: registrar chegada, iniciar, conferir e finalizar. O sistema guarda os detalhes por trás.</p>
    </section>

    <div className="receiving-steps">
      {['Chegada','Início','Conferência','Fim'].map((label, index) => {
        const current = step === 'arrival' ? 0 : step === 'start' ? 1 : step === 'conference' ? 2 : 3;
        return <div key={label} className={index <= current ? 'done' : ''}><span>{index + 1}</span><small>{label}</small></div>;
      })}
    </div>

    {step === 'arrival' && <section className="receiving-card">
      <div className="card-title"><Truck size={20}/><div><strong>Chegada do caminhão</strong><span>Preencha só o essencial</span></div></div>
      <div className="simple-form two-col">
        <label>Placa<input placeholder="ABC1D23" value={plate} onChange={(e)=>setPlate(e.target.value.toUpperCase())}/></label>
        <label>Doca<select value={dock} onChange={(e)=>setDock(e.target.value)}><option>Doca 01</option><option>Doca 02</option><option>Doca 03</option></select></label>
      </div>
      <div className="simple-form">
        <label>Motorista<div className="input-icon"><UserRound size={16}/><input placeholder="Nome do motorista" value={driver} onChange={(e)=>setDriver(e.target.value)}/></div></label>
      </div>
      <div className="simple-form two-col">
        <label>Lacre<input placeholder="Nº do lacre" value={seal} onChange={(e)=>setSeal(e.target.value)}/></label>
        <label>Status do lacre<select value={sealOk ? 'ok' : 'divergente'} onChange={(e)=>setSealOk(e.target.value==='ok')}><option value="ok">Íntegro</option><option value="divergente">Divergente</option></select></label>
      </div>
      {!sealOk && <div className="receiving-alert"><AlertTriangle size={16}/>Lacre divergente: registre uma ocorrência após confirmar a chegada.</div>}
      <button className="receiving-primary" disabled={!plate.trim()||!driver.trim()||!seal.trim()} onClick={confirmArrival}><Check size={17}/>Confirmar chegada</button>
    </section>}

    {step === 'start' && <>
      <section className="receiving-card compact-info">
        <div className="vehicle-summary"><div><span>Placa</span><strong>{plate}</strong></div><div><span>Motorista</span><strong>{driver}</strong></div><div><span>Lacre</span><strong>{seal}</strong></div><div><span>Chegada</span><strong>{arrivalTime}</strong></div></div>
      </section>
      <section className="receiving-card">
        <div className="card-title"><FileCheck2 size={20}/><div><strong>Notas fiscais</strong><span>3 NFs vinculadas à carga</span></div></div>
        <div className="nf-list"><div><span>NF 128745</span><b>{nfReleased?'Liberada':'Aguardando'}</b></div><div><span>NF 128746</span><b>{nfReleased?'Liberada':'Aguardando'}</b></div><div><span>NF 128747</span><b>{nfReleased?'Liberada':'Aguardando'}</b></div></div>
        <button className={`erp-action ${nfReleased?'ok':''}`} onClick={()=>setNfReleased(true)}><FileCheck2 size={17}/>{nfReleased?'NFs liberadas para conferência':'Liberar NFs para conferência'}</button>
        <small className="erp-note">No MVP a ação é simulada. Futuramente ela chama o ERP e retorna o status.</small>
      </section>
      <button className="receiving-primary" disabled={!nfReleased} onClick={startReceiving}><Clock3 size={17}/>Iniciar recebimento</button>
    </>}

    {step === 'conference' && <>
      <section className="receiving-board">
        <div className="board-head"><div><span className="eyebrow">CARGA EM ANDAMENTO</span><strong>8 paletes esperados</strong></div><div className="progress-badge">{progress}%</div></div>
        <div className="board-metrics"><div><strong>{receivedPallets.length}</strong><span>recebidos</span></div><div><strong>{pending.length}</strong><span>faltam</span></div><div><strong>{sampling.length}</strong><span>amostragem</span></div><div><strong>{occurrences.length}</strong><span>ocorrências</span></div></div>
        <div className="progress-line"><i style={{width:`${progress}%`}}/></div>
        <div className="receiving-meta"><span><MapPin size={14}/>{dock}</span><span><Clock3 size={14}/>Início {startTime}</span></div>
      </section>

      <button className="receive-scan" onClick={() => { onScan(); setTimeout(simulatePalletRead, 200); }}><span><ScanLine size={28}/></span><div><small>PRÓXIMA AÇÃO</small><strong>Ler ID do palete</strong><em>Última leitura: {lastCode}</em></div><ChevronRight size={21}/></button>

      {sampling.length > 0 && <section className="sampling-card"><ClipboardCheck size={20}/><div><strong>{sampling[sampling.length-1]} selecionado para amostragem</strong><span>Faça a conferência cega dos produtos deste palete.</span></div><button>Iniciar</button></section>}

      <section className="pallet-map"><div className="section-heading compact"><div><span className="eyebrow">MAPA DA CARGA</span><h2>Paletes</h2></div><span>{receivedPallets.length}/{expectedPallets.length}</span></div><div className="pallet-grid">{expectedPallets.map((p)=><div key={p} className={receivedPallets.includes(p)?'received':'pending'}><span>{p.replace('PLT-','')}</span><small>{sampling.includes(p)?'Amostra':receivedPallets.includes(p)?'OK':'Pendente'}</small></div>)}</div></section>

      <div className="receiving-actions-row"><button onClick={()=>setOccurrenceOpen(true)}><Camera size={17}/>+ Ocorrência</button><button className="finish" disabled={pending.length>0} onClick={finishReceiving}><Check size={17}/>Finalizar</button></div>
      {pending.length > 0 && <div className="pending-note">Faltam {pending.length} palete(s) para liberar o encerramento.</div>}
    </>}

    {step === 'summary' && <section className="receiving-summary">
      <div className="summary-check"><Check size={30}/></div><h2>Recebimento finalizado</h2><p>Registro operacional consolidado e pronto para sincronização.</p>
      <div className="summary-grid"><div><span>Início</span><strong>{startTime}</strong></div><div><span>Fim</span><strong>{endTime}</strong></div><div><span>Duração</span><strong>{duration}</strong></div><div><span>Paletes</span><strong>{receivedPallets.length}/{expectedPallets.length}</strong></div><div><span>Ocorrências</span><strong>{occurrences.length}</strong></div><div><span>NFs</span><strong>3 liberadas</strong></div></div>
      <div className="dossier"><ShieldCheck size={18}/><div><strong>Dossiê da carga</strong><span>{plate} · {driver} · lacre {seal} · {dock}</span></div></div>
    </section>}

    {occurrenceOpen && <div className="occurrence-sheet-wrap"><div className="occurrence-sheet"><div className="sheet-head"><div><span className="eyebrow">OCORRÊNCIA</span><h2>Registrar problema</h2></div><button onClick={()=>setOccurrenceOpen(false)}><X size={19}/></button></div><label>Tipo<select value={occType} onChange={(e)=>setOccType(e.target.value)}><option>Avaria</option><option>Palete faltante</option><option>Palete excedente</option><option>Lacre divergente</option><option>Divergência quantitativa</option><option>Produto não faturado</option><option>Outro</option></select></label><label>Descrição<textarea placeholder="Descreva de forma objetiva..." value={occDescription} onChange={(e)=>setOccDescription(e.target.value)}/></label><label className="photo-field"><span>Foto</span><div><ImagePlus size={19}/><input type="file" accept="image/*" capture="environment" onChange={(e)=>setOccPhoto(e.target.files?.[0]?.name||'')}/><small>{occPhoto||'Adicionar foto'}</small></div></label><button className="receiving-primary" disabled={!occDescription.trim()} onClick={saveOccurrence}><Check size={17}/>Salvar ocorrência</button></div></div>}
  </div>;
}
