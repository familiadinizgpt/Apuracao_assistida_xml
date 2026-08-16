'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CloudUpload, ExternalLink, FileText, Leaf, ScrollText, ShieldCheck } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Carregamento', href: '/', icon: CloudUpload },
    { name: 'Explorador de Documentos', href: '/explorer', icon: FileText },
    { name: 'Análise RTC', href: '/rtc-analysis', icon: BarChart3 },
    { name: 'Relatórios', href: '/reports', icon: ScrollText },
  ];

  return (
    <aside className="brand-sidebar">
      <div className="brand-sidebar-header">
        <div className="brand-lockup">
          <div className="brand-mark"><Leaf size={23} /></div>
          <div className="brand-copy">
            <strong>Consultor do Agro</strong>
            <small>por Diniz Contabilidade</small>
          </div>
        </div>
        <p className="product-label">Apuração Assistida XML</p>
      </div>

      <nav className="brand-sidebar-nav" aria-label="Navegação da apuração">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={isActive ? 'active' : ''}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="brand-sidebar-trust">
        <ShieldCheck size={17} />
        <span>Dados processados na sessão do navegador, com revisão profissional dos resultados.</span>
      </div>

      <div className="brand-sidebar-actions">
        <a href="https://consultordoagro.com.br/?painel=laboratorio">
          <ExternalLink size={15} /> Consultor do Agro
        </a>
      </div>
    </aside>
  );
}
