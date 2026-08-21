'use client';

import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import { logoutAction } from '@/app/acesso/actions';
import { useAccess } from '@/components/AccessProvider';

export function Header() {
  const access = useAccess();

  return (
    <header className="product-header">
      <div className="product-header-copy">
        <span>Webapp Consultor do Agro</span>
        <strong>Apuração Assistida XML</strong>
      </div>
      <div className="product-header-actions">
        {access.hasAccess && <span className="access-plan-chip">{access.label}</span>}
        <span className="privacy-chip"><ShieldCheck size={15} /> Processamento local</span>
        <a className="hub-return-link" href="https://consultordoagro.com.br/?painel=laboratorio">
          Voltar ao Consultor do Agro <ExternalLink size={14} />
        </a>
        {access.hasAccess && (
          <form action={logoutAction}>
            <button className="logout-button" type="submit" aria-label="Encerrar sessão" title="Encerrar sessão">
              <LogOut size={15} />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
