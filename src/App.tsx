import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  Boxes,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cloud,
  Layers3,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tag,
  Truck,
  Wifi,
  X,
} from 'lucide-react';

type ModuleId = 'inventario' | 'recebimento' | 'embarque' | 'precos' | 'validades' | 'auditoria';
type ModuleItem = { id: ModuleId; title: string; subtitle: string; icon: typeof Boxes; accent: string; badge?: string };
type ScanRecord = { code: string; format: string; module: ModuleId | 'rapido'; time: string };
type ValidityMode = 'menu' | 'free' | 'priority';
type ValidityLot = { expiry: string; qty: number; action: string };

const modules: ModuleItem[] = [
  { id: 'inventario', title: 'Inventário', subtitle: 'Contagem e divergências', icon: Boxes, accent: 'cyan', badge: '12 abertos' },
  { id: 'recebimento', title: 'Recebimento', subtitle: 'NF, volumes e conferência', icon: PackageCheck, accent: 'green', badge: '4 docas' },
  { id: 'embarque', title: 'Embarque', subtitle: 'Separação e expedição', icon: Truck, accent: 'violet', badge: '7 cargas' },
  { id: 'precos', title: 'Auditoria de preços', subtitle: 'Gôndola x sistema', icon: Tag, accent: 'amber', badge: '32 pendentes' },
  { id: 'validades', title: 'Auditoria de validades', subtitle: 'Lotes e vencimentos', icon: CalendarClock, accent: 'rose', badge: '18 alertas' },
  { id: 'auditoria', title: 'Auditoria operacional', subtitle: 'Checklists e evidências', icon: ClipboardCheck, accent: 'blue' },
];

const sampleProducts: Record<string, { name: string; sku: string; price: string; location: string }> = {
  '7891000100103': { name: 'Produto demonstrativo 1L', sku: 'SKU 10482', price: 'R$ 12,99', location: 'A03 · M02 · P04' },
  '7894900011517': { name: 'Produto demonstrativo 350ml', sku: 'SKU 20931', price: 'R$ 5,49', location: 'A08 · M01 · P02' },
  '18962': { name: 'CHOC SUFLAIR 50G AO LEITE NESTLÉ', sku: 'SKU 18962', price: 'R$ 6,99', location: 'A05 · M03 · P02' },
  '7908497433581': { name: 'MOCHILA NOTEBOOK FEM COLOR UP ML43358', sku: 'MAT 102073', price: 'R$ 89,90', location: 'A12 · M01 · P03' },
};

const priorityItems = [
  { code: '7908497433581', name: 'Mochila Notebook Color Up', days: 3 },
  { code: '7894900011517', name: 'Produto demonstrativo 350ml', days: 6 },
  { code: '7891000100103', name: 'Produto demonstrativo 1L', days: 12 },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastCode, setLastCode] = useState('7891000100103');
  const [records, setRecords] = useState<ScanRecord[]>([
    { code: '7891000100103', format: 'EAN-13', module: 'inventario', time: '08:42' },
    { code: '7894900011517', format: 'EAN-13', module: 'precos', time: '08:38' },
  ]);
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const [auditMode, setAuditMode] = useState<'menu' | 'random' | 'imported'>('menu');
  const [nonConform, setNonConform] = useState(false);
  const [reason, setReason] = useState('Sem etiqueta');
  const [shelfPrice, setShelfPrice] = useState('');
  const [auditSaved, setAuditSaved] = useState(false);

  const [validityMode, setValidityMode] = useState<ValidityMode>('menu');
  const [expiryDate, setExpiryDate] = useState('');
  const [lotQty, setLotQty] = useState('1');
  const [validityAction, setValidityAction] = useState('Manter em exposição');
  const [validityLots, setValidityLots] = useState<ValidityLot[]>([]);
  const [validitySaved, setValiditySaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wedgeBuffer = useRef('');
  const wedgeTimer = useRef<number | null>(null);

  const product = sampleProducts[lastCode] ?? {
    name: 'Item identificado',
    sku: `COD ${lastCode.slice(-6) || '---'}`,
    price: 'Preço não carregado',
    location: 'Endereço não carregado',
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const registerCode = (code: string, format = 'Código') => {
    const clean = code.trim();
    if (!clean) return;
    setLastCode(clean);
    setRecords((current) => [
      {
        code: clean,
        format,
        module: activeModule?.id ?? 'rapido',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
      ...current,
    ].slice(0, 20));
    setManualCode('');
    setScannerOpen(false);
    setAuditSaved(false);
    setValiditySaved(false);
    setExpiryDate('');
    setLotQty('1');
    setValidityLots([]);
    stopCamera();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT') return;
      if (event.key === 'Enter' && wedgeBuffer.current.length >= 1) {
        registerCode(wedgeBuffer.current, 'Scanner físico');
        wedgeBuffer.current = '';
        return;
      }
      if (event.key.length === 1) {
        wedgeBuffer.current += event.key;
        if (wedgeTimer.current) window.clearTimeout(wedgeTimer.current);
        wedgeTimer.current = window.setTimeout(() => (wedgeBuffer.current = ''), 180);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModule]);

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      detectLoop();
    } catch {
      setCameraError('Não foi possível acessar a câmera. Use o leitor físico ou digite o código.');
    }
  };

  const detectLoop = async () => {
    const Detector = (window as unknown as { BarcodeDetector?: new (config?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string; format: string }>> } }).BarcodeDetector;
    if (!Detector || !videoRef.current) return;
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code', 'data_matrix', 'aztec', 'pdf417'] });
    const tick = async () => {
      if (!streamRef.current || !videoRef.current) return;
      try {
        const found = await detector.detect(videoRef.current);
        if (found[0]?.rawValue) {
          registerCode(found[0].rawValue, found[0].format || 'Camera');
          return;
        }
      } catch {
        // Continua tentando.
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const metrics = useMemo(() => {
    if (activeModule?.id === 'precos') return [['64', 'auditados'], ['59', 'conformes'], ['5', 'divergências']];
    if (activeModule?.id === 'inventario') return [['128', 'itens lidos'], ['94%', 'progresso'], ['7', 'divergências']];
    if (activeModule?.id === 'recebimento') return [['42', 'volumes'], ['36', 'conferidos'], ['2', 'divergências']];
    if (activeModule?.id === 'embarque') return [['18', 'volumes'], ['15', 'separados'], ['3', 'pendentes']];
    if (activeModule?.id === 'validades') return [['51', 'verificados'], ['6', 'alertas'], ['2', 'críticos']];
    return [['9', 'itens'], ['7', 'conformes'], ['2', 'evidências']];
  }, [activeModule]);

  const daysToExpiry = useMemo(() => {
    if (!expiryDate) return null;
    const end = new Date(`${expiryDate}T12:00:00`);
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / 86400000);
  }, [expiryDate]);

  const expiryRisk = daysToExpiry === null ? 'ok' : daysToExpiry < 0 ? 'critical' : daysToExpiry <= 7 ? 'critical' : daysToExpiry <= 30 ? 'warning' : 'ok';
  const expiryLabel = daysToExpiry === null ? 'Aguardando validade' : daysToExpiry < 0 ? `Vencido há ${Math.abs(daysToExpiry)} dia(s)` : daysToExpiry === 0 ? 'Vence hoje' : `${daysToExpiry} dia(s) restantes`;

  const suggestedAction = () => {
    if (daysToExpiry === null) return 'Manter em exposição';
    if (daysToExpiry < 0) return 'Retirar imediatamente';
    if (daysToExpiry <= 7) return 'Priorizar ação comercial';
    if (daysToExpiry <= 30) return 'Monitorar / sinalizar';
    return 'Manter em exposição';
  };

  const addValidityLot = () => {
    if (!expiryDate) return;
    const qty = Math.max(1, Number(lotQty) || 1);
    setValidityLots((current) => [...current, { expiry: expiryDate, qty, action: validityAction || suggestedAction() }]);
    setExpiryDate('');
    setLotQty('1');
    setValidityAction('Manter em exposição');
  };

  const goHome = () => {
    setActiveModule(null);
    setAuditMode('menu');
    setValidityMode('menu');
  };

  const openModule = (module: ModuleItem) => {
    setActiveModule(module);
    if (module.id === 'precos') setAuditMode('menu');
    if (module.id === 'validades') setValidityMode('menu');
  };

  const priceAudit = activeModule?.id === 'precos';
  const validityAudit = activeModule?.id === 'validades';

  const renderHome = () => (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">TURNO ATUAL</span>
          <h1>Bom dia, Operação.</h1>
          <p>Escolha uma rotina ou faça uma leitura rápida.</p>
        </div>
        <div className="hero-orbit"><Smartphone size={26} /><span /></div>
      </section>

      <section className="quick-scan-card" onClick={() => setScannerOpen(true)}>
        <div className="scan-icon"><Barcode size={28} /></div>
        <div className="quick-copy">
          <span className="eyebrow">LEITURA UNIVERSAL</span>
          <strong>Escanear código</strong>
          <small>Numéricos · alfanuméricos · QR · Data Matrix e mais</small>
        </div>
        <ChevronRight size={20} />
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">ROTINAS</span><h2>Módulos operacionais</h2></div>
        <button className="ghost-button"><Layers3 size={15} /> Organizar</button>
      </div>

      <section className="module-grid">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button key={module.id} className={`module-card accent-${module.accent}`} onClick={() => openModule(module)}>
              <div className="module-top"><span className="module-icon"><Icon size={22} /></span>{module.badge && <small>{module.badge}</small>}</div>
              <strong>{module.title}</strong>
              <span>{module.subtitle}</span>
              <div className="module-footer"><ChevronRight size={17} /></div>
            </button>
          );
        })}
        <button className="module-card add-card">
          <div className="module-top"><span className="module-icon"><Plus size={22} /></span></div>
          <strong>Novo módulo</strong>
          <span>Estrutura preparada para expansão</span>
        </button>
      </section>
    </>
  );

  const renderPriceAudit = () => {
    if (auditMode === 'menu') {
      return (
        <>
          <section className="module-hero accent-amber">
            <div className="module-hero-title"><span className="module-icon"><Tag size={24} /></span><div><span className="eyebrow">AUDITORIA DE PREÇOS</span><h1>Como deseja iniciar?</h1></div></div>
            <p>Escolha a origem da auditoria. A leitura continua centralizada no leitor universal.</p>
          </section>
          <section className="audit-start-grid">
            <button onClick={() => setAuditMode('random')}><ScanLine /><div><strong>Auditoria livre</strong><span>Leia produtos diretamente na área de venda</span></div><ChevronRight /></button>
            <button onClick={() => setAuditMode('imported')}><ClipboardCheck /><div><strong>Lista direcionada</strong><span>Executar itens previamente carregados</span></div><ChevronRight /></button>
          </section>
          <section className="audit-info"><strong>32 itens pendentes</strong><span>Última sincronização hoje às 08:51</span></section>
        </>
      );
    }

    return (
      <>
        <section className="module-hero accent-amber">
          <div className="module-hero-title"><span className="module-icon"><Tag size={24} /></span><div><span className="eyebrow">{auditMode === 'random' ? 'AUDITORIA LIVRE' : 'LISTA DIRECIONADA'}</span><h1>Auditoria de preços</h1></div></div>
          <p>Leia o produto, confira o preço do sistema e registre a situação encontrada na gôndola.</p>
        </section>
        <section className="metrics-row">{metrics.map(([v, l]) => <div className="metric-card" key={l}><strong>{v}</strong><span>{l}</span></div>)}</section>
        <button className="primary-scan" onClick={() => setScannerOpen(true)}><span className="pulse-ring"><ScanLine size={30} /></span><span><small>PRONTO PARA LEITURA</small><strong>Ler produto para auditar</strong><em>Câmera, leitor integrado ou digitação</em></span><ChevronRight size={21} /></button>
        <section className="product-panel">
          <div className="product-header"><div><span className="eyebrow">PRODUTO IDENTIFICADO</span><h3>{product.name}</h3></div><span className="success-chip"><Check size={13} /> Lido</span></div>
          <div className="code-display"><Barcode size={24} /><div><strong>{lastCode}</strong><span>{product.sku}</span></div></div>
          <div className="price-audit-value"><span>PREÇO NO SISTEMA</span><strong>{product.price}</strong><small>{product.location}</small></div>
          <label className="nonconform-toggle"><input type="checkbox" checked={nonConform} onChange={(e) => setNonConform(e.target.checked)} /><span><strong>Registrar não conformidade</strong><small>Preço divergente ou produto sem etiqueta</small></span></label>
          {nonConform && <div className="nonconform-panel"><div className="reason-options"><button className={reason === 'Sem etiqueta' ? 'selected' : ''} onClick={() => setReason('Sem etiqueta')}>Sem etiqueta</button><button className={reason === 'Preço divergente' ? 'selected' : ''} onClick={() => setReason('Preço divergente')}>Preço divergente</button></div>{reason === 'Preço divergente' && <label><span>Preço encontrado na gôndola</span><input inputMode="decimal" placeholder="R$ 0,00" value={shelfPrice} onChange={(e) => setShelfPrice(e.target.value)} /></label>}<div className="warning-line"><AlertTriangle size={15} />{reason}</div></div>}
          <div className="audit-actions"><button onClick={() => { setNonConform(false); setShelfPrice(''); setAuditSaved(true); }}><Check size={17} />{nonConform ? 'Salvar ocorrência' : 'Preço conforme'}</button><button className="secondary" onClick={() => setScannerOpen(true)}><ScanLine size={17} />Próximo item</button></div>
          {auditSaved && <div className="saved-note"><Check size={15} />Registro salvo na sessão.</div>}
        </section>
      </>
    );
  };

  const renderValidity = () => {
    if (validityMode === 'menu') {
      return (
        <>
          <section className="module-hero accent-rose">
            <div className="module-hero-title"><span className="module-icon"><CalendarClock size={24} /></span><div><span className="eyebrow">GESTÃO DE VALIDADES</span><h1>Escolha a missão</h1></div></div>
            <p>A validade deixa de ser apenas um campo para preencher: o coletor organiza risco, lote, quantidade e ação necessária.</p>
          </section>
          <section className="risk-summary">
            <div className="critical"><strong>2</strong><span>críticos até 7 dias</span></div>
            <div className="warning"><strong>6</strong><span>até 30 dias</span></div>
            <div><strong>51</strong><span>itens verificados</span></div>
          </section>
          <section className="validity-start">
            <button onClick={() => setValidityMode('free')}><ScanLine /><div><strong>Ronda livre</strong><span>Leia qualquer produto e registre todos os lotes encontrados</span></div><ChevronRight /></button>
            <button onClick={() => setValidityMode('priority')}><AlertTriangle /><div><strong>Lista prioritária</strong><span>Comece pelos itens com maior risco de vencimento</span></div><ChevronRight /></button>
          </section>
          <div className="validity-note">A lógica proposta prioriza prevenção: primeiro identifica o produto, depois registra cada validade encontrada e a quantidade de unidades daquele lote. Assim o mesmo SKU pode ter várias datas diferentes sem perder rastreabilidade.</div>
        </>
      );
    }

    if (validityMode === 'priority') {
      return (
        <>
          <section className="module-hero accent-rose">
            <div className="module-hero-title"><span className="module-icon"><AlertTriangle size={24} /></span><div><span className="eyebrow">LISTA PRIORITÁRIA</span><h1>Atacar o risco primeiro</h1></div></div>
            <p>Itens ordenados por urgência para reduzir perdas e evitar produto vencido em área de venda.</p>
          </section>
          <section className="validity-priority">
            {priorityItems.map((item) => (
              <button key={item.code} className="priority-item" onClick={() => { setLastCode(item.code); setValidityMode('free'); setValidityLots([]); setExpiryDate(''); }}>
                <span className="picon"><CalendarClock size={20} /></span>
                <div><strong>{item.name}</strong><span>{item.code}</span></div>
                <b>{item.days}d</b>
              </button>
            ))}
          </section>
        </>
      );
    }

    return (
      <>
        <section className="module-hero accent-rose">
          <div className="module-hero-title"><span className="module-icon"><CalendarClock size={24} /></span><div><span className="eyebrow">RONDA DE VALIDADE</span><h1>Registrar produto e lotes</h1></div></div>
          <p>Leia o SKU, informe cada validade encontrada e quantas unidades existem naquele lote.</p>
        </section>
        <section className="metrics-row">{metrics.map(([v, l]) => <div className="metric-card" key={l}><strong>{v}</strong><span>{l}</span></div>)}</section>
        <button className="primary-scan" onClick={() => setScannerOpen(true)}><span className="pulse-ring"><ScanLine size={30} /></span><span><small>PASSO 1</small><strong>Ler produto</strong><em>Código de barras, QR ou identificador interno</em></span><ChevronRight size={21} /></button>

        <section className="validity-product">
          <div className="validity-head"><div><span className="eyebrow">PRODUTO EM ANÁLISE</span><h3>{product.name}</h3></div><span className={`risk-chip ${expiryRisk}`}>{expiryLabel}</span></div>
          <div className="validity-code"><Barcode size={20} /><div><strong>{lastCode}</strong><span>{product.sku} · {product.location}</span></div></div>

          <div className="lot-form">
            <label>Data de validade<input type="date" value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); setValidityAction(''); }} /></label>
            <div className="lot-grid">
              <label>Quantidade deste lote<input type="number" min="1" inputMode="numeric" value={lotQty} onChange={(e) => setLotQty(e.target.value)} /></label>
              <label>Ação<select value={validityAction || suggestedAction()} onChange={(e) => setValidityAction(e.target.value)}><option>Manter em exposição</option><option>Monitorar / sinalizar</option><option>Priorizar ação comercial</option><option>Retirar imediatamente</option></select></label>
            </div>
            <div className="expiry-intel"><div><strong>Classificação automática</strong><span>{daysToExpiry === null ? 'Informe a data para calcular o risco' : suggestedAction()}</span></div><span className={`days ${expiryRisk}`}>{daysToExpiry === null ? '--' : daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d` : `${daysToExpiry}d`}</span></div>
          </div>

          <div className="validity-actions">
            <button className="primary" disabled={!expiryDate} onClick={addValidityLot}><Plus size={16} />Adicionar lote</button>
            <button onClick={() => { setValidityLots([]); setExpiryDate(''); setLotQty('1'); }}><X size={16} />Limpar</button>
          </div>

          {validityLots.length > 0 && <div className="lot-list">{validityLots.map((lot, index) => <div className="lot-row" key={`${lot.expiry}-${index}`}><div><strong>{new Date(`${lot.expiry}T12:00:00`).toLocaleDateString('pt-BR')}</strong><span>{lot.action}</span></div><b>{lot.qty} un.</b><button className="remove" onClick={() => setValidityLots((current) => current.filter((_, i) => i !== index))}><X size={15} /></button></div>)}</div>}

          {validityLots.length > 0 && <div className="validity-actions"><button className="primary" onClick={() => setValiditySaved(true)}><Check size={16} />Concluir produto</button><button className="secondary" onClick={() => setScannerOpen(true)}><ScanLine size={16} />Próximo produto</button></div>}
          {validitySaved && <div className="validity-saved"><Check size={15} />Validades e quantidades registradas na sessão.</div>}
        </section>
      </>
    );
  };

  const renderGenericModule = () => (
    <>
      <section className={`module-hero accent-${activeModule?.accent}`}>
        <div className="module-hero-title"><span className="module-icon">{activeModule && <activeModule.icon size={24} />}</span><div><span className="eyebrow">ROTINA ATIVA</span><h1>{activeModule?.title}</h1></div></div>
        <p>{activeModule?.subtitle}. Fluxo preparado para toque, câmera ou gatilho físico.</p>
      </section>
      <section className="metrics-row">{metrics.map(([v, l]) => <div className="metric-card" key={l}><strong>{v}</strong><span>{l}</span></div>)}</section>
      <button className="primary-scan" onClick={() => setScannerOpen(true)}><span className="pulse-ring"><ScanLine size={30} /></span><span><small>PRONTO PARA LEITURA</small><strong>Escanear próximo item</strong><em>Câmera, leitor integrado ou digitação</em></span><ChevronRight size={21} /></button>
      <section className="product-panel"><div className="product-header"><div><span className="eyebrow">PRODUTO IDENTIFICADO</span><h3>{product.name}</h3></div><span className="success-chip"><Check size={13} /> Lido</span></div><div className="code-display"><Barcode size={24} /><div><strong>{lastCode}</strong><span>{product.sku}</span></div></div><div className="product-details"><div><span>Preço</span><strong>{product.price}</strong></div><div><span>Endereço</span><strong>{product.location}</strong></div></div><div className="action-row"><button><Plus size={16} /> Quantidade</button><button><ShieldCheck size={16} /> Confirmar</button></div></section>
    </>
  );

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div className="brand-row">
            {activeModule ? <button className="icon-button" onClick={goHome}><ArrowLeft size={20} /></button> : <div className="brand-mark"><ScanLine size={22} /></div>}
            <div className="brand-copy"><span className="eyebrow">COLETOR OPERACIONAL</span><strong>{activeModule?.title ?? 'Operação Geral'}</strong></div>
            <div className="status-stack"><span className="status-dot online" />Online</div>
          </div>
          <div className="context-strip"><div><ShoppingCart size={15} />Loja 01</div><div><Wifi size={15} />Wi-Fi</div><div><Cloud size={15} />Sync agora</div></div>
        </header>

        <main className="content">
          {!activeModule ? renderHome() : priceAudit ? renderPriceAudit() : validityAudit ? renderValidity() : renderGenericModule()}
        </main>

        <nav className="bottom-nav">
          <button className={!activeModule ? 'active' : ''} onClick={goHome}><Layers3 size={20} /><span>Módulos</span></button>
          <button onClick={() => setScannerOpen(true)} className="scan-nav"><span><ScanLine size={24} /></span><small>Escanear</small></button>
          <button><Clock3 size={20} /><span>Histórico</span></button>
          <button><Settings size={20} /><span>Ajustes</span></button>
        </nav>
      </div>

      {scannerOpen && (
        <div className="scanner-overlay">
          <div className="scanner-sheet">
            <div className="scanner-head"><div><span className="eyebrow">LEITOR UNIVERSAL</span><h2>Escanear código</h2></div><button className="icon-button" onClick={() => { setScannerOpen(false); stopCamera(); }}><X size={20} /></button></div>
            <div className={`camera-window ${cameraActive ? 'live' : ''}`}><video ref={videoRef} playsInline muted /><div className="scan-corners"><i /><i /><i /><i /></div><div className="laser-line" />{!cameraActive && <div className="camera-placeholder"><Camera size={32} /><strong>Câmera traseira</strong><span>Aponte para o código</span></div>}</div>
            <button className="camera-button" onClick={cameraActive ? stopCamera : startCamera}><Camera size={17} />{cameraActive ? 'Desligar câmera' : 'Ativar câmera'}</button>
            {cameraError && <div className="error-note"><AlertTriangle size={15} />{cameraError}</div>}
            <div className="or-divider"><span>OU DIGITE / USE O GATILHO</span></div>
            <label className="manual-field"><span>Código numérico ou alfanumérico</span><div><Search size={17} /><input autoFocus placeholder="Ex.: 789..., CX-04-A17, SKU..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') registerCode(manualCode, 'Entrada manual'); }} /></div></label>
            <button className="confirm-code" disabled={!manualCode.trim()} onClick={() => registerCode(manualCode, 'Entrada manual')}><Check size={17} />Confirmar leitura</button>
            <div className="supported-formats"><QrCode size={18} /><span>EAN · UPC · Code 39/93/128 · QR · Data Matrix · PDF417 · identificadores alfanuméricos</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
