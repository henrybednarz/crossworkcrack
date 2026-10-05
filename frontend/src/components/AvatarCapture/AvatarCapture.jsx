import { useEffect, useRef, useState } from 'react';
import Avatar from '../Avatar';
import { toSquareJpeg } from '../../utils/image.js';
import './AvatarCapture.css';

const canUseCamera = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

// onCancel is only passed when replacing an existing photo.
export default function AvatarCapture({ name, currentSrc, saving, error, onSave, onCancel }) {
    const [photo, setPhoto] = useState(null);
    const [stream, setStream] = useState(null);
    const [message, setMessage] = useState(null);
    const videoRef = useRef(null);
    const fileRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        return () => stream?.getTracks().forEach((track) => track.stop());
    }, [stream]);

    const startCamera = async () => {
        setMessage(null);
        try {
            setStream(await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }));
        } catch {
            setMessage('Couldn’t open your camera. You can upload a photo instead.');
        }
    };

    const capture = async () => {
        setPhoto(await toSquareJpeg(videoRef.current, { mirror: true }));
        setStream(null);
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setMessage(null);
        try {
            setPhoto(await toSquareJpeg(file));
        } catch {
            setMessage('That file couldn’t be read as an image.');
        }
    };

    const handleSave = async () => {
        if (await onSave(photo)) setPhoto(null);
    };

    let preview;
    let actions;
    if (stream) {
        preview = <video ref={videoRef} className="avatar-capture-video" autoPlay playsInline muted />;
        actions = (
            <>
                <button type="button" onClick={capture}>Capture</button>
                <button type="button" className="secondary-btn" onClick={() => setStream(null)}>Cancel</button>
            </>
        );
    } else if (photo) {
        preview = <Avatar src={photo} name={name} size="lg" />;
        actions = (
            <>
                <button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Use This Photo'}
                </button>
                <button type="button" className="secondary-btn" onClick={() => setPhoto(null)} disabled={saving}>
                    Retake
                </button>
            </>
        );
    } else {
        preview = <Avatar src={currentSrc} name={name} size="lg" />;
        actions = (
            <>
                {canUseCamera && <button type="button" onClick={startCamera}>Take Photo</button>}
                <button type="button" className={canUseCamera ? 'secondary-btn' : undefined} onClick={() => fileRef.current?.click()}>
                    Upload Photo
                </button>
                {onCancel && (
                    <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
                )}
            </>
        );
    }

    return (
        <div className="avatar-capture">
            <div className="avatar-capture-preview">{preview}</div>
            {message && <p className="avatar-capture-message">{message}</p>}
            {error && photo && <p className="avatar-capture-message">Couldn&apos;t save your photo. Try again.</p>}
            <div className="avatar-capture-actions">{actions}</div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>
    );
}
