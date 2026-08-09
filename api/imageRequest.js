import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_CONVERTED_IMAGE_DIMENSION = 2560;
const HEIC_CONVERTER_URL =
    '/node_modules/heic-to/dist/iife/heic-to.js';
const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);
const HEIC_IMAGE_TYPES = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);
let heicConverterPromise = null;

const loadImageFromBlob = blob => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            resolve({ image, objectUrl });
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('converted_image_decode_failed'));
        };
        image.src = objectUrl;
    });
};

const canvasToJpegBlob = (canvas, quality) => {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) resolve(blob);
                else reject(new Error('jpeg_compression_failed'));
            },
            'image/jpeg',
            quality,
        );
    });
};

const optimizeConvertedJpeg = async jpegBlob => {
    const { image, objectUrl } = await loadImageFromBlob(jpegBlob);
    try {
        const scale = Math.min(
            1,
            MAX_CONVERTED_IMAGE_DIMENSION /
                Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas_context_unavailable');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let optimizedBlob = jpegBlob;
        for (const quality of [0.84, 0.72, 0.6, 0.48]) {
            optimizedBlob = await canvasToJpegBlob(canvas, quality);
            if (optimizedBlob.size <= MAX_IMAGE_SIZE) return optimizedBlob;
        }
        return optimizedBlob;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

const isHeicFile = file => {
    return (
        HEIC_IMAGE_TYPES.has(file?.type?.toLowerCase()) ||
        /\.(heic|heif)$/i.test(file?.name || '')
    );
};

const loadHeicConverter = () => {
    if (window.HeicTo) return Promise.resolve(window.HeicTo);
    if (heicConverterPromise) return heicConverterPromise;

    heicConverterPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HEIC_CONVERTER_URL;
        script.async = true;
        script.onload = () => {
            if (window.HeicTo) resolve(window.HeicTo);
            else reject(new Error('heic_converter_not_found'));
        };
        script.onerror = () => reject(new Error('heic_converter_load_failed'));
        document.head.appendChild(script);
    });

    return heicConverterPromise;
};

export const validateImageFile = file => {
    if (!file) {
        return { ok: false, message: '이미지 파일을 선택해 주세요.' };
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return {
            ok: false,
            message: 'JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있어요.',
        };
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return {
            ok: false,
            message: '이미지는 10MB 이하만 업로드할 수 있어요.',
        };
    }
    return { ok: true };
};

export const prepareImageFile = async file => {
    if (!isHeicFile(file)) {
        const validation = validateImageFile(file);
        return validation.ok
            ? { ok: true, file, converted: false }
            : validation;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return {
            ok: false,
            message: '이미지는 10MB 이하만 업로드할 수 있어요.',
        };
    }

    try {
        const heicTo = await loadHeicConverter();
        const result = await heicTo({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.86,
        });
        const convertedBlob = Array.isArray(result) ? result[0] : result;
        const jpegBlob = await optimizeConvertedJpeg(convertedBlob);
        const convertedFile = new File(
            [jpegBlob],
            file.name.replace(/\.(heic|heif)$/i, '') + '.jpg',
            {
                type: 'image/jpeg',
                lastModified: file.lastModified,
            },
        );
        const validation = validateImageFile(convertedFile);
        if (!validation.ok) return validation;

        return {
            ok: true,
            file: convertedFile,
            converted: true,
            originalName: file.name,
        };
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        return {
            ok: false,
            code: 'heic_conversion_failed',
            message: 'HEIC 이미지를 JPEG로 변환하지 못했어요.',
            error,
        };
    }
};

export const createImagePreviewUrl = file => {
    return URL.createObjectURL(file);
};

const createPresignedUrl = (file, imageType) => {
    return requestJson(`${getServerUrl()}/images/presigned-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageType,
            contentType: file.type,
            fileSize: file.size,
        }),
    });
};

export const uploadImage = async (file, imageType) => {
    const validation = validateImageFile(file);
    if (!validation.ok) {
        return {
            ok: false,
            code: 'invalid_image_file',
            message: validation.message,
        };
    }

    const presignedResult = await createPresignedUrl(file, imageType);
    if (!presignedResult.ok || !presignedResult.data?.uploadUrl) {
        return {
            ok: false,
            status: presignedResult.status,
            code: presignedResult.code || 'presigned_url_failed',
            message: '이미지 업로드 URL을 발급하지 못했어요.',
        };
    }

    try {
        const uploadResponse = await fetch(
            presignedResult.data.uploadUrl,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': presignedResult.data.contentType,
                },
                body: file,
            },
        );

        if (!uploadResponse.ok) {
            return {
                ok: false,
                status: uploadResponse.status,
                code: 's3_upload_failed',
                message: '이미지를 저장하지 못했어요.',
            };
        }

        return {
            ok: true,
            data: {
                imageUrl: presignedResult.data.imageUrl,
                objectKey: presignedResult.data.objectKey,
            },
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            code: 's3_upload_failed',
            message: '이미지 저장 중 네트워크 오류가 발생했어요.',
            error,
        };
    }
};
