import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function EmailDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <Link 
        to="/inbox" 
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inbox
      </Link>
      <h1 className="text-xl font-semibold text-slate-800">Email Details</h1>
      <p className="text-sm text-slate-500 mt-1">Viewing message: {id}</p>
    </div>
  );
}
