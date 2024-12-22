import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/inspection/Header';
import ViewToggle from '../components/inspection/ViewToggle';
import DefectsList from '../components/inspection/DefectsList';
import Summary from '../components/inspection/Summary';
import PlayPauseButton from '../components/inspection/PlayPauseButton';
import { defectsList } from '../constants/defects';

function Return({ savedState, onStateChange, onLogEntry }) {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [language, setLanguage] = useState('english');
  const [defects, setDefects] = useState({});
  const [currentDefectCount, setCurrentDefectCount] = useState({});
  const [checkedQuantity, setCheckedQuantity] = useState(0);
  const [goodOutput, setGoodOutput] = useState(savedState?.goodOutput || 0);
  const [defectPieces, setDefectPieces] = useState(0);
  const [returnDefectQty, setReturnDefectQty] = useState(0);
  const [inspectionData, setInspectionData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasDefectSelected, setHasDefectSelected] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (savedState?.inspectionData) {
      setInspectionData(savedState.inspectionData);
    }
  }, [savedState]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    onStateChange?.({
      defects,
      currentDefectCount,
      checkedQuantity,
      goodOutput,
      defectPieces,
      returnDefectQty,
      language,
      view,
      inspectionData,
      isPlaying,
      hasDefectSelected,
      timer
    });
  }, [
    defects, currentDefectCount, checkedQuantity, goodOutput,
    defectPieces, returnDefectQty, language, view, inspectionData,
    isPlaying, hasDefectSelected, timer, onStateChange
  ]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePassReturn = () => {
    if (!isPlaying || hasDefectSelected) return;
    setCheckedQuantity(prev => prev + 1);
    setGoodOutput(prev => prev + 1);
    
    onLogEntry?.({
      type: 'pass-return',
      garmentNo: checkedQuantity + 1,
      status: 'Pass Return',
      timestamp: new Date().getTime(),
      defectDetails: []
    });
  };

  const handleRejectReturn = () => {
    if (!isPlaying || !Object.values(currentDefectCount).some(count => count > 0)) return;
    
    const currentTime = new Date().getTime();
    setCheckedQuantity(prev => prev + 1);
    setDefectPieces(prev => prev + 1);
    
    const totalNewDefects = Object.values(currentDefectCount).reduce((sum, count) => sum + count, 0);
    setReturnDefectQty(prev => prev + totalNewDefects);

    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setDefects(prev => ({
          ...prev,
          [index]: (prev[index] || 0) + count
        }));
      }
    });

    const currentDefects = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList[language][index],
        count,
        timestamp: currentTime
      }));

    onLogEntry?.({
      type: 'reject-return',
      garmentNo: checkedQuantity + 1,
      status: 'Reject Return',
      defectDetails: currentDefects,
      timestamp: currentTime
    });

    setCurrentDefectCount({});
    setHasDefectSelected(false);
  };

  const hasActiveDefects = Object.values(currentDefectCount).some(count => count > 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Header inspectionData={inspectionData} editable={true} />
        </div>
      </div>

      <div className="fixed top-32 left-0 right-0 bg-white shadow-md z-30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ViewToggle
              view={view}
              onViewChange={setView}
              onLanguageChange={setLanguage}
            />
            <PlayPauseButton
              isPlaying={isPlaying}
              onToggle={() => setIsPlaying(!isPlaying)}
              timer={formatTime(timer)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-40 pb-32">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <button
              onClick={handlePassReturn}
              disabled={!isPlaying || hasDefectSelected}
              className={`w-full py-2 rounded font-medium ${
                isPlaying && !hasDefectSelected ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              Pass Return
            </button>
          </div>
          <div className="col-span-8">
            <DefectsList
              view={view}
              language={language}
              defects={defects}
              currentDefectCount={currentDefectCount}
              onDefectUpdate={(index, value) => {
                setDefects(prev => ({ ...prev, [index]: value }));
                setHasDefectSelected(true);
              }}
              onCurrentDefectUpdate={(index, value) => {
                setCurrentDefectCount(prev => ({ ...prev, [index]: value }));
                setHasDefectSelected(true);
              }}
              onLogEntry={onLogEntry}
              isPlaying={isPlaying}
              onDefectSelect={setHasDefectSelected}
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleRejectReturn}
              disabled={!isPlaying || !hasActiveDefects}
              className={`w-full py-2 rounded font-medium ${
                isPlaying && hasActiveDefects ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              Reject Return
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Summary
            defects={defects}
            checkedQuantity={checkedQuantity}
            goodOutput={goodOutput}
            defectPieces={defectPieces}
            returnDefectQty={returnDefectQty}
          />
        </div>
      </div>
    </div>
  );
}

export default Return;
