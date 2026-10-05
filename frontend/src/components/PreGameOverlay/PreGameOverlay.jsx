import Modal from '../Modal';
import './PreGameOverlay.css';

// status: 'loading' | 'ready' | 'error'
export default function PreGameOverlay({ status, hasWon, onStart, onRetry }) {
    if (status === 'error') {
        return (
            <Modal>
                <h2>Failed to load the puzzle.</h2>
                <p className="pre-game-hint">Today&apos;s mini may not be available yet.</p>
                <button type="button" onClick={onRetry}>Retry</button>
            </Modal>
        );
    }

    return (
        <Modal>
            <h2>Ready to Begin?</h2>
            <button type="button" onClick={onStart} disabled={status !== 'ready'}>
                {status === 'loading' ? 'Loading...' : hasWon ? 'View Puzzle' : 'Start Puzzle'}
            </button>
        </Modal>
    );
}
