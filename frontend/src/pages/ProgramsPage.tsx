import { useNavigate } from 'react-router-dom';
import { useProgram } from '../context/ProgramContext';

function ProgramsPage() {
  const navigate = useNavigate();
  const { programs, loading, error } = useProgram();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">Programs</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Your training programs
          </p>
        </div>
        <button
          onClick={() => navigate('/programs/new')}
          className="w-10 h-10 flex items-center justify-center bg-teal-600 text-white rounded-full
            hover:bg-teal-700 transition-colors active:scale-95 shadow-lg shadow-teal-600/25"
          aria-label="Create new program"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="p-4 space-y-3">
        {programs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm">No programs yet</p>
            <button
              onClick={() => navigate('/programs/new')}
              className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg
                hover:bg-teal-700 transition-colors"
            >
              Create your first program
            </button>
          </div>
        ) : (
          programs.map((program) => {
            const progress = program.totalSessions > 0
              ? Math.round((program.completedSessions / program.totalSessions) * 100)
              : 0;

            return (
              <button
                key={program.id}
                onClick={() => navigate(`/programs/${program.id}`)}
                className="w-full text-left bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4
                  transition-all duration-200 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                        {program.tag}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-50 truncate">
                      {program.name}
                    </h3>
                    {program.goal && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {program.goal}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                        <span>{program.completedSessions}/{program.totalSessions} sessions</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-300 dark:text-slate-600 flex-shrink-0 mt-1">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProgramsPage;
