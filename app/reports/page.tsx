'use client';

import React, { useMemo } from 'react';
import { useFiscalStore } from '@/application/store/useFiscalStore';
import { Download, AlertTriangle, PackageX, UserX } from 'lucide-react';

interface NonCompliantInvoice {
  accessKey: string;
  supplierName: string;
  taxRegime: string;
  itemDescription: string;
  ncm: string;
  value: number;
}

interface NonCompliantSupplier {
  cnpj: string;
  name: string;
  taxRegime: string;
  itemCount: number;
}

interface NonCompliantProduct {
  ncm: string;
  description: string;
  supplierName: string;
  supplierRegime: string;
  itemCount: number;
}

export default function ReportsPage() {
  const { documents } = useFiscalStore();

  const { nonCompliantInvoices, supplierRanking, productRanking } = useMemo(() => {
    const invoices: NonCompliantInvoice[] = [];
    const supMap: Record<string, NonCompliantSupplier> = {};
    const prodMap: Record<string, NonCompliantProduct> = {};

    // Helper: Identifica se o CFOP caracteriza uma operação de natureza monetária
    // Importante: No XML de Entrada (INBOUND), o CFOP gravado na nota é o CFOP de SAÍDA do Fornecedor (Ex: 5102, 6101).
    // O sistema de gestão do cliente (ERP) que converte isso para 1102, 2101 na entrada.
    // Como estamos lendo o XML bruto, precisamos validar as raízes de CFOP de venda (Saída do fornecedor).
    const isCommercialOperation = (cfop: string) => {
      if (!cfop) return false;
      const cleanCfop = String(cfop).replace(/\D/g, ''); 
      if (cleanCfop.length < 4) return false;
      
      const prefix = cleanCfop.substring(0, 2);
      const validIssuerPrefixes = [
        '51', '61', '71', // Vendas de produção própria ou de terceiros (O fornecedor me vendeu)
        '54', '64',       // Vendas sujeitas à Substituição Tributária (O fornecedor me vendeu com ST)
        '55', '65'        // Venda de ativo imobilizado do fornecedor para mim
      ];
      
      // Caso a nota seja de Emissão Própria (Entrada Emitida pelo próprio cliente), o CFOP já será 1, 2 ou 3.
      // Então também autorizamos as raízes clássicas de entrada caso ocorra.
      const validReceiverPrefixes = [
        '11', '21', '31', // Compras
        '14', '24',       // Compras ST
        '15', '25', '35'  // Compras de ativo
      ];

      return validIssuerPrefixes.includes(prefix) || validReceiverPrefixes.includes(prefix);
    };

    documents.forEach(doc => {
      // Estamos focando em "Fornecedores" e Entradas conforme a regra de negócios
      if (doc.direction !== 'INBOUND') return;

      const isRpa = doc.tax_regime === 'RPA';
      
      doc.items.forEach(item => {
        // Ignora o item se não for uma operação comercial de fato (excluindo remessas 59/69, devoluções 52/62, etc)
        if (!isCommercialOperation(item.cfop)) return;

        const hasIbsCbs = (item.rtc.vIBS || 0) + (item.rtc.vCBS || 0) > 0;
        
        if (!hasIbsCbs) {
          // 1. Invoices Detail (Rule: Somente RPA)
          if (isRpa) {
            invoices.push({
              accessKey: doc.access_key,
              supplierName: doc.issuer.name || 'Desconhecido',
              taxRegime: doc.tax_regime,
              itemDescription: item.description,
              ncm: item.ncm,
              value: item.net_value || item.gross_value,
            });
          }

          // 2. Supplier Ranking (Rule: Show regime, independentemente se RPA ou Simples)
          const supId = doc.issuer.cnpj_cpf || 'N/A';
          if (!supMap[supId]) {
            supMap[supId] = { 
              cnpj: supId, 
              name: doc.issuer.name || 'Desconhecido', 
              taxRegime: doc.tax_regime, 
              itemCount: 0 
            };
          }
          supMap[supId].itemCount++;

          // 3. Product Ranking (Rule: Product + Supplier Regime)
          const pId = `${item.ncm}-${item.description}-${supId}`;
          if (!prodMap[pId]) {
            prodMap[pId] = { 
              ncm: item.ncm, 
              description: item.description, 
              supplierName: doc.issuer.name || 'Desconhecido', 
              supplierRegime: doc.tax_regime, 
              itemCount: 0 
            };
          }
          prodMap[pId].itemCount++;
        }
      });
    });

    return {
      nonCompliantInvoices: invoices,
      supplierRanking: Object.values(supMap).sort((a, b) => b.itemCount - a.itemCount),
      productRanking: Object.values(prodMap).sort((a, b) => b.itemCount - a.itemCount).slice(0, 50), // Top 50 para performance de tela
    };
  }, [documents]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportCsv = (type: 'invoices' | 'suppliers' | 'products') => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (type === 'invoices') {
      csvContent += "Chave de Acesso,Fornecedor,Regime Tributario,Descricao Item,NCM,Valor\n";
      nonCompliantInvoices.forEach(row => {
        csvContent += `"${row.accessKey}","${row.supplierName}","${row.taxRegime}","${row.itemDescription}","${row.ncm}",${row.value}\n`;
      });
    } else if (type === 'suppliers') {
      csvContent += "CNPJ,Fornecedor,Regime Tributario,Qntd de Itens sem Destaque\n";
      supplierRanking.forEach(row => {
        csvContent += `"${row.cnpj}","${row.name}","${row.taxRegime}",${row.itemCount}\n`;
      });
    } else if (type === 'products') {
      csvContent += "NCM,Descricao,Fornecedor,Regime do Fornecedor,Qntd de Ocorrencias\n";
      productRanking.forEach(row => {
        csvContent += `"${row.ncm}","${row.description}","${row.supplierName}","${row.supplierRegime}",${row.itemCount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_inconformidade_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Relatórios de Conformidade</h2>
          <p className="text-on-surface-variant text-sm max-w-2xl">
            Análise de fornecedores, produtos e documentos que não apresentaram os destaques obrigatórios da nova Legislação.
          </p>
        </section>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-12 text-center text-on-surface-variant">
          <p className="text-lg font-medium">Nenhum documento processado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 pb-12">
      <section className="flex flex-col gap-2">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Relatórios de Conformidade</h2>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Análise de Aquisições Monetárias de Entradas (Compras, Ativo e Uso/Consumo) que não apresentaram impactos destacáveis de IBS/CBS. Foram omitidos itens como Amostras Grátis e Remessas/Devoluções.
        </p>
      </section>

      {/* Tabela de Invoices (RPA sem Destaque) */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error/10 text-error rounded flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">NFs de Entrada RPA sem IBS/CBS</h3>
          </div>
          <button 
            onClick={() => exportCsv('invoices')}
            className="flex items-center gap-2 text-xs font-bold bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-md transition-colors"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-surface-container-low text-on-surface-variant text-[10px] uppercase tracking-widest font-bold sticky top-0 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">NCM</th>
                <th className="px-6 py-4 font-medium">Fornecedor</th>
                <th className="px-6 py-4 font-medium">Chave NFe</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {nonCompliantInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                    Excelente. Nenhuma NF-e de RPA omitiu informações de IBS/CBS.
                  </td>
                </tr>
              ) : (
                nonCompliantInvoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-body truncate max-w-[200px]" title={inv.itemDescription}>{inv.itemDescription}</td>
                    <td className="px-6 py-4 font-mono text-on-surface-variant text-xs">{inv.ncm}</td>
                    <td className="px-6 py-4 font-body font-medium">{inv.supplierName}</td>
                    <td className="px-6 py-4 font-mono text-primary text-[10px] tracking-wide">{inv.accessKey}</td>
                    <td className="px-6 py-4 font-mono text-right text-on-surface">{formatCurrency(inv.value)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ranking de Fornecedores */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/10 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 text-error rounded flex items-center justify-center">
                <UserX size={20} />
              </div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Ranking: Fornecedores S/ Destaque</h3>
            </div>
            <button 
              onClick={() => exportCsv('suppliers')}
              className="flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors"
              title="Exportar Fornecedores CSV"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-surface-container-low text-on-surface-variant text-[10px] uppercase tracking-widest font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Fornecedor</th>
                  <th className="px-6 py-4 font-medium">Regime</th>
                  <th className="px-6 py-4 font-medium text-right">Ocorrências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {supplierRanking.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">Nenhum registro.</td>
                  </tr>
                ) : (
                  supplierRanking.map((sup, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-body font-medium truncate max-w-[150px]" title={sup.name}>
                        {sup.name}
                        <div className="text-[10px] font-mono text-on-surface-variant mt-1">{sup.cnpj}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${sup.taxRegime === 'RPA' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {sup.taxRegime === 'RPA'? 'RPA' : 'SIMPLES'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-error font-bold">{sup.itemCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking de Produtos */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/10 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 text-error rounded flex items-center justify-center">
                <PackageX size={20} />
              </div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Ranking: Produtos S/ Destaque</h3>
            </div>
            <button 
              onClick={() => exportCsv('products')}
              className="flex items-center gap-2 text-xs font-bold hover:text-primary transition-colors"
              title="Exportar Produtos CSV"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-surface-container-low text-on-surface-variant text-[10px] uppercase tracking-widest font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto / NCM</th>
                  <th className="px-6 py-4 font-medium">Fornecedor</th>
                  <th className="px-6 py-4 font-medium text-right">Faltas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {productRanking.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">Nenhum registro.</td>
                  </tr>
                ) : (
                  productRanking.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-body truncate max-w-[150px]" title={prod.description}>
                        {prod.description}
                        <div className="text-[10px] font-mono text-on-surface-variant mt-1">{prod.ncm}</div>
                      </td>
                      <td className="px-6 py-4 font-body text-xs">
                        {prod.supplierName}
                        <div className="mt-1">
                           <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${prod.supplierRegime === 'RPA' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                              {prod.supplierRegime === 'RPA'? 'RPA' : 'SIMPLES'}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-error font-bold">{prod.itemCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
