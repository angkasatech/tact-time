import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScanComplete }) => {
    const [mode, setMode] = useState('manual'); // 'camera' or 'manual'
    const [manualInput, setManualInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (html5QrCodeRef.current && isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, [isScanning]);

    const startScanning = async () => {
        try {
            setError('');
            setIsScanning(true);

            html5QrCodeRef.current = new Html5Qrcode('qr-reader');

            const config = {
                fps: 10,
                qrbox: { width: 300, height: 150 }, // Wider box for barcodes
                aspectRatio: 2.0, // Better for wide barcodes
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_93
                ]
            };

            await html5QrCodeRef.current.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    // Success callback
                    stopScanning();
                    onScanComplete(decodedText);
                },
                (errorMessage) => {
                    // Error callback (can be ignored for continuous scanning)
                }
            );
        } catch (err) {
            setError('Failed to start camera. Please check permissions or try manual input.');
            setIsScanning(false);
            console.error('Scanner error:', err);
        }
    };

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualInput.trim()) {
            onScanComplete(manualInput.trim());
            setManualInput('');
        }
    };

    const toggleMode = () => {
        if (isScanning) {
            stopScanning();
        }
        setMode(mode === 'camera' ? 'manual' : 'camera');
        setError('');
    };

    return (
        <div className="scanner-container glass-card">
            <div className="scanner-header">
                <h2>Scan VIN Number</h2>
                <button className="btn btn-secondary" onClick={toggleMode}>
                    {mode === 'camera' ? '📝 Manual Input' : '📷 Use Camera'}
                </button>
            </div>

            {mode === 'camera' ? (
                <div className="camera-mode">
                    {!isScanning && (
                        <div className="scan-instructions">
                            <p>📱 Position the barcode horizontally within the box</p>
                            <p>💡 Keep steady and ensure good lighting</p>
                        </div>
                    )}
                    <div id="qr-reader" ref={scannerRef} className="qr-reader"></div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="scanner-controls">
                        {!isScanning ? (
                            <button className="btn btn-primary" onClick={startScanning}>
                                🎥 Start Camera
                            </button>
                        ) : (
                            <button className="btn btn-secondary" onClick={stopScanning}>
                                ⏹️ Stop Camera
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="manual-mode">
                    <form onSubmit={handleManualSubmit}>
                        <label htmlFor="vin-input">Enter VIN Number</label>
                        <input
                            id="vin-input"
                            type="text"
                            className="input-field"
                            placeholder="Type or paste VIN here..."
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={!manualInput.trim()}
                        >
                            ✅ Submit VIN
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
