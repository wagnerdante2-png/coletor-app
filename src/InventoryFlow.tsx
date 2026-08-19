import { useMemo, useState } from 'react';
import { AlertTriangle, Barcode, Boxes, Check, ChevronRight, Minus, Plus, RotateCcw, ScanLine } from 'lucide-react';

type Mode='menu'|'free'|'guided'|'recount';

const demoItems=[
  {code:'7891000100103',name:'Produto demonstrativo 1L',sku:'SKU 10482',address:'A03 · M02 · P04'},
  {code:'7894900011517',name:'Produto demonstrativo 350ml',sku:'SKU 20931',address:'A03 · M02 · P05'},
  {code:'CX-04-A17',name:'Caixa logística A17',sku:'ID CX-04-A17',address:'Depósito · Rua 04'},
];

export default function InventoryFlow({onScan}:{onScan:()=>void}){
  const[mode,setMode]=useState<Mode>('menu');
  const[index,setIndex]=useState(0);
  const[qty,setQty]=useState(1);
  const[counted,setCounted]=useState(128);
  const[divergences,setDivergences]=useState(7);
  const[saved,setSaved]=useState(false);
  const item=demoItems[index%demoItems.length];
  const progress=useMemo(()=>Math.min(100,Math.round((counted/180)*100)),[counted]);

  const confirm=()=>{
    setSaved(true);
    setCounted(v=>v+1);
    if(qty===0)setDivergences(v=>v+1);
    window.setTimeout(()=>{setSaved(false);setQty(1);setIndex(v=>(v+1)%demoItems.length)},450);
  };

  if(mode==='menu') return <>
    <section className="inv-hero">
      <div className="inv-hero-icon"><Boxes size={28}/></div>
      <div><span>INVENTÁRIO</span><h1>Escolha a rotina</h1><p>Contagem rápida, guiada e sem expor saldo do sistema durante a conferência.</p></div>
    </section>
    <section className="inv-summary">
      <div><strong>12</strong><span>inventários abertos</span></div>
      <div><strong>94%</strong><span>maior progresso</span></div>
      <div><strong>7</strong><span>divergências</span></div>
    </section>
    <section className="inv-options">
      <button onClick={()=>setMode('free')}><ScanLine/><div><strong>Contagem livre</strong><span>Ler produtos e informar quantidades</span></div><ChevronRight/></button>
      <button onClick={()=>setMode('guided')}><Boxes/><div><strong>Contagem dirigida</strong><span>Seguir setor, rua e endereço planejados</span></div><ChevronRight/></button>
      <button onClick={()=>setMode('recount')}><RotateCcw/><div><strong>Reconferência</strong><span>Atacar somente itens com divergência</span></div><ChevronRight/></button>
    </section>
  </>;

  return <>
    <section className="inv-session-head">
      <div><span>{mode==='free'?'CONTAGEM LIVRE':mode==='guided'?'CONTAGEM DIRIGIDA':'RECONFERÊNCIA'}</span><h1>{mode==='guided'?'Setor Utilidades · Rua 03':mode==='recount'?'7 itens para revisar':'Inventário em andamento'}</h1></div>
      <button onClick={()=>setMode('menu')}>Trocar</button>
    </section>

    <section className="inv-progress-card">
      <div className="inv-progress-top"><div><strong>{counted}</strong><span>itens contados</span></div><div><strong>{progress}%</strong><span>progresso</span></div><div className={divergences>0?'warn':''}><strong>{divergences}</strong><span>divergências</span></div></div>
      <div className="inv-progress"><i style={{width:`${progress}%`}}/></div>
      <small>{mode==='guided'?'Próximo endereço: A03 · M02 · P04':'Sessão salva automaticamente no dispositivo'}</small>
    </section>

    <button className="inv-scan" onClick={onScan}><ScanLine size={29}/><div><span>PRONTO PARA LEITURA</span><strong>Ler próximo item</strong><small>Código de barras, QR ou código alfanumérico</small></div><ChevronRight/></button>

    <section className="inv-product">
      <div className="inv-product-title"><div><span>ITEM EM CONTAGEM</span><h2>{item.name}</h2></div><span className="inv-blind">CONTAGEM CEGA</span></div>
      <div className="inv-code"><Barcode size={21}/><div><strong>{item.code}</strong><span>{item.sku}</span></div></div>
      <div className="inv-address"><span>ENDEREÇO</span><strong>{item.address}</strong></div>

      <div className="inv-qty-label"><span>Quantidade encontrada</span><small>Informe apenas o que está fisicamente no local</small></div>
      <div className="inv-stepper">
        <button onClick={()=>setQty(v=>Math.max(0,v-1))}><Minus/></button>
        <input inputMode="numeric" type="number" min="0" value={qty} onChange={e=>setQty(Math.max(0,Number(e.target.value)||0))}/>
        <button onClick={()=>setQty(v=>v+1)}><Plus/></button>
      </div>

      {mode==='recount'&&<div className="inv-recount-note"><AlertTriangle size={16}/><div><strong>Item selecionado para reconferência</strong><span>O saldo esperado permanece oculto até a confirmação.</span></div></div>}

      <button className="inv-confirm" onClick={confirm}><Check size={18}/>{saved?'Contagem registrada':'Confirmar contagem'}</button>
      <div className="inv-secondary-actions"><button onClick={()=>setQty(0)}>Zerar item</button><button onClick={onScan}>Ler outro código</button></div>
    </section>
  </>;
}
