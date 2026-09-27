/* Public specimen-code routing. These codes are discoverable shortcuts, never credentials. */
(() => {
  'use strict';
  const scriptUrl=document.currentScript?.src || new URL('../js/specimen-codes.js',location.href).href;
  const labRoot=new URL('../',scriptUrl);
  const normalize=value=>String(value||'').trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const navigate=file=>location.assign(new URL(file,labRoot).href);
  const openCases=()=>document.querySelector('[data-anomaly-open]')?.click();

  function run(input,{close=()=>{},status=()=>{}}={}) {
    const code=normalize(input);
    if(code==='CGNULLPULL'||code==='CGQAGACHA'){
      status('NULL//PULL // SYNTHETIC DRAW CHANNEL');close();
      const destination=new URL(location.href);
      if(destination.searchParams.get('gacha-test')==='1')openCases();
      else {destination.searchParams.set('gacha-test','1');location.assign(destination.href)}
      return true;
    }
    if(code==='CGROOT09'||code==='CGKAMISAMA'){
      status('ROOT://KAMISAMA // AUTH TOKEN REQUIRED');close();navigate('kamisama.html');return true;
    }
    if(code==='CGMITOSIS03'||code==='CGTRIPLICATE'){
      const result=window.CINEGENOME_ANOMALY?.redeemSpecimenCode('CGTRIPLICATE') || 'unavailable';
      if(result==='granted'){
        status('MITOSIS://03 // THREE PACKS REPLICATED LOCALLY');close();openCases();
      }else status({claimed:'ALREADY REDEEMED IN THIS BROWSER.',test_mode:'EXIT QA TEST MODE TO CLAIM REAL PACKS.',storage_unavailable:'STORAGE UNAVAILABLE // NO PACKS CREDITED.',unavailable:'ANOMALY CHANNEL UNAVAILABLE // RETRY AFTER LOADING.'}[result]||'CODE REFUSED.');
      return true;
    }
    if(code==='CGHELLGATE09'||code==='CGSECTOR09'){
      if(!window.CINEGENOME_SECTOR09?.open){status('SECTOR CHANNEL UNAVAILABLE.');return true}
      status('HELLGATE://09 // FEED ONLINE');close();window.CINEGENOME_SECTOR09.open();return true;
    }
    if(code==='CGPHANTOMREEL'||code==='CGSYNAPSE12'){
      if(!window.CINEGENOME_SIGNAL_LAB?.open){status('SIGNAL ENGINE UNAVAILABLE.');return true}
      const mode=code==='CGPHANTOMREEL'?'ghost':'sonic';
      status(mode==='ghost'?'PHANTOM://REEL // ARCHIVE GHOST FOUND':'SYNAPSE://12 // SIGNAL READY');
      close();window.CINEGENOME_SIGNAL_LAB.open(mode);return true;
    }
    if(code==='CGATLAS'){
      const target=document.querySelector('.module-btn[data-view="atlas"],.m-bottom-nav button[data-target="atlas"]');
      if(!target){status('ATLAS ROUTE UNAVAILABLE.');return true}
      status('ATLAS ROUTE ACQUIRED.');close();target.click();return true;
    }
    if(code==='CGWALL'){
      status('COLLECTIVE TRACE // LAB WALL');close();navigate('lab-wall.html');return true;
    }
    return false;
  }
  window.CINEGENOME_SPECIMEN_CODES={run,normalize};
})();
