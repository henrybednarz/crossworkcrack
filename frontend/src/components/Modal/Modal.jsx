import './Modal.css';

export default function Modal({ className = '', children }) {
    return (
        <div className={`modal-overlay ${className}`} role="dialog" aria-modal="true">
            <div className="modal-content">{children}</div>
        </div>
    );
}
