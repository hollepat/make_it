import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgram } from '../context/ProgramContext';
import { toInputDateString } from '../utils/dateUtils';

export default function CreateProgramPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createProgram, updateProgram, getProgramById } = useProgram();

  const isEditMode = Boolean(id);
  const existingProgram = id ? getProgramById(id) : undefined;

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [tag, setTag] = useState('');
  const [startDate, setStartDate] = useState(toInputDateString(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && existingProgram) {
      setName(existingProgram.name);
      setGoal(existingProgram.goal || '');
      setTag(existingProgram.tag);
      setStartDate(existingProgram.startDate);
    }
  }, [isEditMode, existingProgram]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        setError('Please enter a program name');
        return;
      }
      if (!tag.trim()) {
        setError('Please enter a tag');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        if (isEditMode && id) {
          await updateProgram(id, {
            name: name.trim(),
            goal: goal.trim() || undefined,
            tag: tag.trim(),
            startDate,
          });
          navigate(`/programs/${id}`);
        } else {
          const program = await createProgram({
            name: name.trim(),
            goal: goal.trim() || undefined,
            tag: tag.trim(),
            startDate,
          });
          navigate(`/programs/${program.id}`);
        }
      } catch (err) {
        console.error('Failed to save program:', err);
        setError('Failed to save program. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, goal, tag, startDate, isEditMode, id, createProgram, updateProgram, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
          {isEditMode ? 'Edit Program' : 'New Program'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          {isEditMode ? 'Update your training program' : 'Create a new training program'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Program Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-slate-700 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent
                bg-white dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 transition-shadow"
              placeholder="e.g. Marathon Training"
              required
            />
          </div>

          {/* Tag */}
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tag <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-slate-700 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent
                bg-white dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 transition-shadow"
              placeholder="e.g. marathon, strength, climbing"
              required
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              A short keyword to categorize this program
            </p>
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Goal <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-slate-700 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent
                bg-white dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 transition-shadow resize-none"
              placeholder="e.g. Run a marathon in under 4 hours"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-slate-700 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent
                bg-white dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 transition-shadow"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 safe-area-bottom">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold
                rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !tag.trim()}
              className={`
                flex-1 py-3 px-4 font-semibold rounded-xl
                transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2
                ${isSubmitting || !name.trim() || !tag.trim()
                  ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Program'
              ) : (
                'Create Program'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
