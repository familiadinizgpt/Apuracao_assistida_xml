import { Shield, CheckSquare, Zap, Clock } from 'lucide-react';
import { UploadZone } from '@/components/UploadZone';

export default function UploadPage() {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <section className="flex flex-col gap-2">
        <span className="page-eyebrow">Reforma tributária e auditoria fiscal</span>
        <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">Apuração Assistida de XML</h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Carregue NF-e e CT-e para validar, organizar e analisar documentos fiscais com rastreabilidade e revisão profissional.
        </p>
      </section>

      {/* Interactive Upload Zone */}
      <UploadZone />

      {/* Guidelines / Tips Footer Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Shield size={18} />
            <h5 className="text-xs font-bold uppercase tracking-widest">Privacidade</h5>
          </div>
          <p className="text-[11px] text-on-surface-variant">Os arquivos são processados na sessão do navegador e não são enviados a uma base remota.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <CheckSquare size={18} />
            <h5 className="text-xs font-bold uppercase tracking-widest">Validação</h5>
          </div>
          <p className="text-[11px] text-on-surface-variant">Leitura estruturada de NF-e e CT-e com retorno individual por documento processado.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Zap size={18} />
            <h5 className="text-xs font-bold uppercase tracking-widest">Processamento</h5>
          </div>
          <p className="text-[11px] text-on-surface-variant">Lotes XML e ZIP são analisados com status de validação e identificação de erros.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={18} />
            <h5 className="text-xs font-bold uppercase tracking-widest">Sessão</h5>
          </div>
          <p className="text-[11px] text-on-surface-variant">Os resultados permanecem disponíveis enquanto esta sessão do navegador estiver aberta.</p>
        </div>
      </section>
    </div>
  );
}
