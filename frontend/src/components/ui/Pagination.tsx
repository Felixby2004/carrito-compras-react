interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisible = 5;
  
  let visiblePages = pages;
  if (totalPages > maxVisible) {
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    visiblePages = pages.slice(start - 1, end);
  }

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        Anterior
      </button>
      
      {visiblePages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1 border rounded hover:bg-gray-100">1</button>
          {visiblePages[0] > 2 && <span className="px-2 py-1">...</span>}
        </>
      )}
      
      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 border rounded ${
            currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}
      
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="px-2 py-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-100">
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        Siguiente
      </button>
    </div>
  );
}