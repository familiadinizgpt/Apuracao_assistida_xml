import { ExternalLink, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="product-header">
      <div className="product-header-copy">
        <span>Webapp Consultor do Agro</span>
        <strong>Apuração Assistida XML</strong>
      </div>
      <div className="product-header-actions">
        <span className="privacy-chip"><ShieldCheck size={15} /> Processamento local</span>
        <a className="hub-return-link" href="https://consultordoagro.com.br/?painel=laboratorio">
          Voltar ao Consultor do Agro <ExternalLink size={14} />
        </a>
      </div>
    </header>
  );
}
