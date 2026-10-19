// Calculadora de frete por BAIRRO — 18/10/2026.
// Regra (decidida em 18/10/2026, combinada com a Fernanda): R$5 por km de carro do Prado até o bairro
// (R$2,50 × ida e volta), valor TOTAL de levar e buscar, mínimo R$30. Só entrega em Nova Friburgo.
// As distâncias moram em frete_bairros.js (gerado por _build/bairros_frete.py): nenhuma chave no ar.
// Bairro grande tem rua perto e rua longe: quando o preço das duas pontas difere em R$5 ou mais, mostra os dois.
// Substitui a do Google (Distance Matrix), que parou por falta de faturamento e culpava a cliente
// ("confere se digitou certo") por um defeito que era nosso.
(function(){
  const POR_KM = 5, MINIMO = 30;
  const WA = 'https://wa.me/5522988138206';
  // como a cliente costuma escrever × como os Correios escrevem
  const APELIDOS = {'muri': 'Mury'};
  const norm = s => (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,' ').trim();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // [bairro, km médio, km da rua mais perto, km da mais longe, ruas medidas]
  const LISTA = (window.FRETE_BAIRROS||[]).map(b => ({nome:b[0], km:b[1], min:b[2], max:b[3], n:norm(b[0])}));
  const km = v => v.toFixed(1).replace('.', ',');

  const valor = km => Math.max(MINIMO, Math.round(km*POR_KM));

  // devolve a lista de bairros que batem: 1 = achou · 0 = não está na lista · 2+ = ambíguo
  function achar(txt){
    let t = norm(txt);
    if(!t) return [];
    t = norm(APELIDOS[t] || t);
    const exato = LISTA.find(b => b.n === t);
    if(exato) return [exato];
    // "cons paulino", "jardim calif": aceita quando só UM bairro bate, nunca chuta entre dois
    const palavras = t.split(' ');
    return LISTA.filter(b => { const bp = b.n.split(' '); return palavras.every(p => bp.some(w => w.startsWith(p))); });
  }

  window.calcFrete = function(){
    const campo = document.getElementById('frete-bairro'), out = document.getElementById('frete-result');
    if(!campo || !out) return;
    const txt = campo.value.trim();
    if(!txt){ out.textContent = 'Escreva o bairro da festa e escolha na lista.'; return; }
    const achados = achar(txt);
    if(achados.length > 1){
      out.textContent = 'Tem ' + achados.length + ' bairros com esse nome: ' + achados.slice(0, 4).map(b => b.nome).join(', ') +
        (achados.length > 4 ? '…' : '') + '. Escolha o seu na lista.';
      return;
    }
    const b = achados[0];
    if(!b){
      const link = WA + '?text=' + encodeURIComponent('Oi! Queria saber o frete da decoração pro bairro ' + txt + '.');
      out.innerHTML = 'Não achei esse bairro na lista. A entrega é só em Nova Friburgo: se for aqui, ' +
        '<a href="' + esc(link) + '" target="_blank" id="frete-wa" ' +
        'style="color:var(--gold-light);text-decoration:underline;text-underline-offset:3px;">chama a Fernanda no WhatsApp</a> ' +
        'que ela calcula pra você. 😊';
      // o contador de cliques no WhatsApp só liga nos links que existem quando a página abre: este nasce depois
      document.getElementById('frete-wa').addEventListener('click', () => {
        if(typeof trackEvent === 'function') trackEvent('whatsapp_click', {location:'frete'});
      });
      return;
    }
    const perto = valor(b.min), longe = valor(b.max);
    out.innerHTML = longe - perto >= 5
      ? '<strong>' + esc(b.nome) + '</strong> · de ' + km(b.min) + ' a ' + km(b.max) + ' km do Prado, conforme a rua' +
        '<br>Frete: <strong>R$' + perto + ' a R$' + longe + '</strong> (levar e buscar)'
      : '<strong>' + esc(b.nome) + '</strong> · ' + km(b.km) + ' km do Prado' +
        '<br>Frete: <strong>R$' + valor(b.km) + '</strong> (levar e buscar)';
  };

  // sugestões enquanto a cliente digita
  const campo = document.getElementById('frete-bairro');
  if(campo){
    const dl = document.createElement('datalist');
    dl.id = 'frete-bairros';
    LISTA.forEach(b => { const o = document.createElement('option'); o.value = b.nome; dl.appendChild(o); });
    document.body.appendChild(dl);
    campo.setAttribute('list', 'frete-bairros');
    campo.addEventListener('keydown', e => { if(e.key === 'Enter') window.calcFrete(); });
    campo.addEventListener('change', () => window.calcFrete());
  }
})();
