import { useEffect, useState } from 'react';
import { ArrowLeft, Cloud, PackageCheck, ShoppingCart, Wifi } from 'lucide-react';
import ReceivingFlow from './ReceivingFlow';

export default function ReceivingBridge(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const handler=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      const button=target?.closest('button');
      if(!button) return;
      const text=(button.textContent||'').toLowerCase();
      if(text.includes('recebimento') && button.classList.contains('module-card')){
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    };
    document.addEventListener('click',handler,true);
    return()=>document.removeEventListener('click',handler,true);
  },[]);
  if(!open) return null;
  const openScanner=()=>{
    const scan=document.querySelector('.scan-nav') as HTMLButtonElement|null;
    scan?.click();
  };
  return <div className="receiving-bridge">
    <div className="phone-frame receiving-phone">
      <header className="topbar">
        <div className="brand-row">
          <button className="icon-button" onClick={()=>setOpen(false)} aria-label="Voltar"><ArrowLeft size={20}/></button>
          <div className="brand-copy"><span className="eyebrow">COLETOR OPERACIONAL</span><strong>Recebimento</strong></div>
          <div className="status-stack"><span className="status-dot online"/>Online</div>
        </div>
        <div className="context-strip"><div><ShoppingCart size={15}/>Loja 01</div><div><Wifi size={15}/>Wi-Fi</div><div><Cloud size={15}/>Sync agora</div></div>
      </header>
      <main className="content"><ReceivingFlow lastCode="ID aguardando leitura" onScan={openScanner}/></main>
    </div>
  </div>;
}
