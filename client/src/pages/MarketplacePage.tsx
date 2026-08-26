import React, { useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Boxes, Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleStore } from '../store/useModuleStore';
import { ModuleCard } from '../components/ModuleCard';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    modules,
    categories,
    selectedCategory,
    searchQuery,
    sortBy,
    isLoading,
    fetchModules,
    fetchCategories,
    setCategory,
    setSearchQuery,
    setSortBy,
  } = useModuleStore();

  useEffect(() => {
    fetchCategories();
    fetchModules();
  }, [fetchCategories, fetchModules]);

  const allCategories = ['All', ...categories.map((c) => c.name)];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Boxes className="w-7 h-7 text-amber-400" />
            <span>Module Marketplace</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse reusable software microservices, inspect schemas, and compose projects on the canvas.
          </p>
        </div>

        <button
          onClick={() => navigate('/modules/create')}
          className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/25 flex items-center gap-2 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Module</span>
        </button>
      </div>

      {/* Filter Toolbar: Search, Sort & Category Pills */}
      <div className="glass-gold-panel p-4 rounded-2xl space-y-4 border border-amber-500/20 shadow-xl shadow-black/70">
        {/* Row 1: Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules by keyword, slug, description or author..."
              className="w-full bg-[#090b10] border border-amber-500/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ArrowUpDown className="w-4 h-4 text-amber-400/70" />
            <span className="text-xs text-amber-200/70 font-mono">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#090b10] border border-amber-500/20 text-amber-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="popular">Most Popular</option>
              <option value="downloads">Most Downloaded</option>
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
          <Filter className="w-4 h-4 text-amber-400/70 shrink-0 mr-1" />
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold shadow-md shadow-amber-500/30'
                    : 'bg-[#10131c] text-slate-400 hover:text-amber-200 hover:bg-[#181d28] border border-amber-500/15'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-amber-400/70">Loading marketplace modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="py-20 text-center glass-gold-panel rounded-3xl border border-amber-500/20 p-8 space-y-3 max-w-md mx-auto shadow-2xl">
          <Layers className="w-10 h-10 text-amber-500/40 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Modules Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No software modules matched category <span className="text-amber-300 font-mono">"{selectedCategory}"</span> with query <span className="text-amber-300 font-mono">"{searchQuery}"</span>.
          </p>
          <button
            onClick={() => {
              setCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#161a26] hover:bg-[#202636] text-amber-200 border border-amber-500/20 rounded-xl text-xs font-semibold transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      )}
    </div>
  );
};
