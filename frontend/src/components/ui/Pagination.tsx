import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const from = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const to = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {totalItems !== undefined && from !== undefined && to !== undefined && (
        <p className="text-base text-slate-500 font-semibold">
          Mostrando <span className="text-indigo-600 font-black">{from}–{to}</span> de <span className="text-indigo-600 font-black">{totalItems}</span> productos
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-soft"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-12 text-center text-slate-400 text-lg font-bold">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-12 h-12 rounded-2xl text-base font-black transition-all border ${
                currentPage === page
                  ? 'bg-gradient-primary text-white border-indigo-500 shadow-glow scale-105'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:scale-105 shadow-soft'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-soft"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-6 h-6 text-slate-700" />
        </button>
      </div>
    </div>
  );
}
