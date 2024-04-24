import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div className="flex justify-center items-center mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md"
            >
                &lt; Prev
            </button>
            <div className="mr-2">
                Page {currentPage} of {totalPages}
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md"
            >
                Next &gt;
            </button>
        </div>
    );
};

export default Pagination;  