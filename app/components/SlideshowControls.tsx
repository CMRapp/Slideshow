export default function SlideshowControls({ 
  isPaused, 
  onPauseToggle, 
  onNext, 
  onPrevious, 
  onFullscreenToggle,
  isFullscreen,
  currentItem,
  mediaItems
}: SlideshowControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onPrevious}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Previous"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={onPauseToggle}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? (
            <PlayIcon className="w-6 h-6" />
          ) : (
            <PauseIcon className="w-6 h-6" />
          )}
        </button>
        
        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Next"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-300">
          {currentItem.team_name} - {currentItem.item_type} {currentItem.item_number}
        </div>
        
        <div className="text-sm text-gray-400">
          {mediaItems.findIndex(item => item.id === currentItem.id) + 1} / {mediaItems.length}
        </div>
        
        <button
          onClick={onFullscreenToggle}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <ArrowsPointingInIcon className="w-6 h-6" />
          ) : (
            <ArrowsPointingOutIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
} 