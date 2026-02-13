'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { FaCamera, FaSearchPlus, FaSearchMinus, FaUndo, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

interface AvatarUploaderProps {
    currentPhotoUrl?: string;
    onPhotoUploaded: (url: string) => void;
    userId?: string;
    displayName?: string;
    disabled?: boolean;
}

export default function AvatarUploader({
    currentPhotoUrl,
    onPhotoUploaded,
    userId,
    displayName,
    disabled = false,
}: AvatarUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null);
                setZoom(1);
                setCrop({ x: 0, y: 0 });
                setError('');
            });
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedImageBlob) {
                throw new Error('Could not create cropped image');
            }

            // Generate filename
            const fileName = `avatar_${Date.now()}.jpg`;
            const storagePath = userId
                ? `profile-photos/${userId}/${fileName}`
                : `temp-avatars/${Date.now()}/${fileName}`;

            const storageRef = ref(storage, storagePath);

            await uploadBytes(storageRef, croppedImageBlob, {
                contentType: 'image/jpeg',
            });

            const downloadUrl = await getDownloadURL(storageRef);
            onPhotoUploaded(downloadUrl);

            // Cleanup
            setImageSrc(null);
            setUploading(false);
        } catch (e) {
            console.error(e);
            setError('Failed to upload image. Please try again.');
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
                {/* Current Avatar Display */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#00245D] flex items-center justify-center text-white text-3xl font-bold">
                        {currentPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={currentPhotoUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{(displayName?.[0] || 'U').toUpperCase()}</span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={disabled || uploading}
                        className="absolute bottom-0 right-0 p-2 bg-[#00245D] text-white rounded-full shadow-md hover:bg-[#003380] transition-colors border-2 border-white"
                        title="Change photo"
                    >
                        <FaCamera className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1">
                    <h3 className="text-[#00245D] font-bold text-lg">Profile Photo</h3>
                    <p className="text-[#00245D]/60 text-sm mb-3">
                        Upload a photo to help the community recognize you.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            disabled={disabled || uploading}
                            className="px-4 py-2 bg-white border border-[#00245D]/20 rounded-lg text-sm font-semibold text-[#00245D] hover:bg-[#00245D]/5 transition-colors shadow-sm"
                        >
                            Upload New
                        </button>
                        {currentPhotoUrl && (
                            <button
                                type="button"
                                onClick={() => onPhotoUploaded('')}
                                disabled={disabled || uploading}
                                className="px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <FaTrash className="w-3 h-3" /> Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {error && (
                <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            {/* Cropper Modal/Overlay */}
            {imageSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#00245D]">Adjust Photo</h3>
                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="relative h-64 sm:h-80 w-full bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <FaSearchMinus className="text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00245D]"
                                />
                                <FaSearchPlus className="text-gray-400" />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={uploading}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={uploading}
                                    className="flex-1 px-4 py-3 bg-[#00245D] text-white font-bold rounded-xl hover:bg-[#003380] transition-colors flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FaCheck /> Save & Apply
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
