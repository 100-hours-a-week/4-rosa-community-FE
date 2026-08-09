import Dialog from '../component/dialog/dialog.js';
import Header, {
    updateHeaderProfile,
} from '../component/header/header.js';
import {
    authCheck,
    getQueryString,
    prependChild,
    resolveImageUrl,
} from '../utils/function.js';
import {
    createPost,
    updatePost,
    getBoardItem,
    getPostCategories,
} from '../api/board-writeRequest.js';
import {
    createImagePreviewUrl,
    prepareImageFile,
    uploadImage,
} from '../api/imageRequest.js';

const HTTP_OK = 200;

const MAX_TITLE_LENGTH = 26;
const MAX_CONTENT_LENGTH = 1500;

const DEFAULT_PROFILE_IMAGE = '/public/profile_default.svg';

const submitButton = document.querySelector('#submit');
const titleInput = document.querySelector('#title');
const contentInput = document.querySelector('#content');
const categorySelect = document.querySelector('#category');
const imageInput = document.querySelector('#image');
const imagePreview = document.querySelector('#imagePreview');
const imagePreviewElement = imagePreview?.querySelector('img');
const imagePreviewText = document.getElementById('imagePreviewText');
const removeImageButton = document.querySelector('#removeImageButton');
const uploadNotice = document.querySelector('.uploadNotice');
const contentHelpElement = document.querySelector(
    '.inputBox p[name="content"]',
);

const boardWrite = {
    categoryCode: '',
    title: '',
    content: '',
};

let isModifyMode = false;
let modifyData = {};
let deleteImage = false;
let postImageUrl = null;
let selectedImageFile = null;
let localPreviewUrl = null;
let isSubmitting = false;
let isPreparingImage = false;

const setUploadNotice = (message, isError = false) => {
    if (!uploadNotice) return;
    uploadNotice.textContent = message;
    uploadNotice.style.color = isError
        ? 'var(--color-danger)'
        : 'var(--color-muted)';
};

const setImagePreview = (src, fileName) => {
    if (!imagePreview || !imagePreviewElement || !imagePreviewText) return;
    imagePreviewElement.onerror = () => {
        imagePreviewElement.onerror = null;
        imagePreviewElement.removeAttribute('src');
        imagePreview.classList.add('isHidden');
        setUploadNotice('이미지 미리보기를 불러오지 못했어요.', true);
    };
    imagePreviewElement.src = src;
    imagePreviewText.textContent = fileName;
    imagePreview.classList.remove('isHidden');
};

const clearImagePreview = () => {
    if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        localPreviewUrl = null;
    }
    selectedImageFile = null;
    postImageUrl = null;
    deleteImage = isModifyMode;
    imageInput.value = '';
    imagePreview?.classList.add('isHidden');
    if (imagePreviewElement) imagePreviewElement.removeAttribute('src');
    if (imagePreviewText) imagePreviewText.textContent = '';
    setUploadNotice('JPG, PNG, WEBP, GIF, HEIC · 최대 10MB');
};

const setSubmitting = value => {
    isSubmitting = value;
    if (value) {
        submitButton.disabled = true;
        submitButton.textContent = selectedImageFile
            ? '이미지 저장 중...'
            : isModifyMode
              ? '수정 중...'
              : '등록 중...';
        return;
    }
    submitButton.textContent = isModifyMode ? '수정 내용 저장' : '등록하기';
    observeSignupData();
};

const observeSignupData = () => {
    const { categoryCode, title, content } = boardWrite;
    if (
        isSubmitting ||
        isPreparingImage ||
        !categoryCode ||
        !title ||
        !content
    ) {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#9ca5a9';
    } else {
        submitButton.disabled = false;
        submitButton.style.backgroundColor = '#0c1e2e';
    }
};

const getBoardData = imageUrl => {
    return {
        categoryCode: boardWrite.categoryCode,
        title: boardWrite.title,
        content: boardWrite.content,
        postImageUrl: imageUrl,
        ...(isModifyMode ? { deleteImage } : {}),
    };
};

const addBoard = async () => {
    if (isSubmitting) return;
    if (boardWrite.title.length > MAX_TITLE_LENGTH) {
        Dialog('게시글', '제목은 26자 이하로 입력해주세요.');
        return;
    }

    setSubmitting(true);
    try {
        let imageUrl = postImageUrl;
        if (selectedImageFile) {
            const uploadResult = await uploadImage(selectedImageFile, 'POST');
            if (!uploadResult.ok) {
                setUploadNotice(uploadResult.message, true);
                Dialog('이미지 업로드 실패', uploadResult.message);
                return;
            }
            imageUrl = uploadResult.data.imageUrl;
            postImageUrl = imageUrl;
            selectedImageFile = null;
            deleteImage = false;
        }

        const boardData = getBoardData(imageUrl);
        if (!isModifyMode) {
            const { ok, data, code } = await createPost(boardData);
            if (!ok) {
                const message =
                    code === 'post_category_not_found'
                        ? '선택한 카테고리를 찾을 수 없습니다.'
                        : code === 'unauthorized'
                          ? '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
                          : '게시글 등록에 실패했습니다. 입력값을 확인해 주세요.';
                Dialog('게시글 등록 실패', message);
                return;
            }

            const postId = data?.id;
            if (postId) {
                window.location.href = `/html/board.html?id=${postId}&categoryCode=${boardWrite.categoryCode}`;
                return;
            }
            contentHelpElement.textContent =
                '제목, 내용을 모두 작성해주세요.';
            return;
        }

        const postId = getQueryString('postId');
        const { ok, status, code } = await updatePost(postId, boardData);
        if (!ok) {
            const message =
                code === 'post_category_not_found'
                    ? '선택한 카테고리를 찾을 수 없습니다.'
                    : '게시글 수정에 실패했습니다.';
            Dialog('게시글 수정 실패', message);
            return;
        }

        if (status === HTTP_OK) {
            window.location.href = `/html/board.html?id=${postId}&categoryCode=${boardWrite.categoryCode}`;
        } else {
            Dialog('게시글', '게시글 수정 실패');
        }
    } finally {
        setSubmitting(false);
    }
};
const changeEventHandler = async (event, uid) => {
    if (uid === 'categoryCode') {
        boardWrite.categoryCode = event.target.value;
    } else if (uid == 'title') {
        const value = event.target.value;
        const helperElement = contentHelpElement;
        if (!value || value == '') {
            boardWrite[uid] = '';
            helperElement.textContent = '제목을 입력해주세요.';
        } else if (value.length > MAX_TITLE_LENGTH) {
            helperElement.textContent = '제목은 26자 이하로 입력해주세요.';
            titleInput.value = value.substring(0, MAX_TITLE_LENGTH);
            boardWrite[uid] = value.substring(0, MAX_TITLE_LENGTH);
        } else {
            boardWrite[uid] = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'content') {
        const value = event.target.value;
        const helperElement = contentHelpElement;
        if (!value || value == '') {
            boardWrite[uid] = '';
            helperElement.textContent = '내용을 입력해주세요.';
        } else if (value.length > MAX_CONTENT_LENGTH) {
            helperElement.textContent = '내용은 1500자 이하로 입력해주세요.';
            contentInput.value = value.substring(0, MAX_CONTENT_LENGTH);
            boardWrite[uid] = value.substring(0, MAX_CONTENT_LENGTH);
        } else {
            boardWrite[uid] = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'image') {
        const file = event.target.files[0];
        if (!file) return;
        if (/\.(heic|heif)$/i.test(file.name)) {
            setUploadNotice('HEIC 이미지를 JPEG로 변환 중입니다.');
        }
        isPreparingImage = true;
        imageInput.disabled = true;
        observeSignupData();
        const prepared = await prepareImageFile(file);
        isPreparingImage = false;
        imageInput.disabled = false;
        if (!prepared.ok) {
            event.target.value = '';
            setUploadNotice(prepared.message, true);
            Dialog('이미지 선택 실패', prepared.message);
            observeSignupData();
            return;
        }

        selectedImageFile = prepared.file;
        deleteImage = false;
        try {
            if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
            localPreviewUrl = createImagePreviewUrl(selectedImageFile);
            const previewName = prepared.converted
                ? `${prepared.originalName} → ${selectedImageFile.name}`
                : selectedImageFile.name;
            setImagePreview(localPreviewUrl, previewName);
            setUploadNotice(
                prepared.converted
                    ? 'HEIC 이미지를 JPEG로 변환했어요. 등록할 때 저장됩니다.'
                    : '등록할 때 이미지가 함께 저장됩니다.',
            );
        } catch (error) {
            selectedImageFile = null;
            event.target.value = '';
            setUploadNotice('이미지 미리보기를 만들지 못했어요.', true);
            Dialog(
                '이미지 선택 실패',
                '이미지 파일을 다시 선택해 주세요.',
            );
        }
    }

    observeSignupData();
};
const getBoardModifyData = async postId => {
    const { ok, data } = await getBoardItem(postId);
    if (!ok) throw new Error('서버 응답 오류');
    return data;
};

const checkModifyMode = () => {
    const postId = getQueryString('postId');
    if (!postId) return false;
    return postId;
};

const addEvent = () => {
    submitButton.addEventListener('click', addBoard);
    categorySelect.addEventListener('change', event =>
        changeEventHandler(event, 'categoryCode'),
    );
    titleInput.addEventListener('input', event =>
        changeEventHandler(event, 'title'),
    );
    contentInput.addEventListener('input', event =>
        changeEventHandler(event, 'content'),
    );
    imageInput.addEventListener('change', event =>
        changeEventHandler(event, 'image'),
    );
    removeImageButton?.addEventListener('click', clearImagePreview);
};

const setCategoryOptions = async () => {
    const fallbackCategories = [
        { code: 'INFO', name: '정보' },
        { code: 'REVIEW', name: '후기' },
        { code: 'QNA', name: '질문' },
        { code: 'COMPANY', name: '동행' },
    ];

    const { ok, data } = await getPostCategories();
    const categories = ok && Array.isArray(data) ? data : fallbackCategories;

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.code;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    const requestedCategoryCode = getQueryString('categoryCode');
    if (
        requestedCategoryCode &&
        categories.some(category => category.code === requestedCategoryCode)
    ) {
        categorySelect.value = requestedCategoryCode;
        boardWrite.categoryCode = requestedCategoryCode;
        observeSignupData();
    }
};

const setModifyData = data => {
    categorySelect.value = data.category?.code || '';
    titleInput.value = data.title;
    contentInput.value = data.content;

    const displayImageUrl = resolveImageUrl(data.postImageUrl);
    if (displayImageUrl) {
        const fileName = displayImageUrl.split('/').pop();
        setImagePreview(displayImageUrl, fileName);
    }

    boardWrite.categoryCode = data.category?.code || '';
    boardWrite.title = data.title;
    boardWrite.content = data.content;
    postImageUrl = data.postImageUrl || null;
    deleteImage = false;

    observeSignupData();
};

const init = async () => {
    const modifyId = checkModifyMode();
    const headerElement = Header(
        modifyId ? '이야기 수정' : '새 글 올리기',
        1,
        DEFAULT_PROFILE_IMAGE,
    );
    prependChild(document.body, headerElement);

    const authResult = await authCheck();
    if (!authResult.ok) return;
    const profileImage = resolveImageUrl(
        authResult.data?.profileImageUrl,
        DEFAULT_PROFILE_IMAGE,
    );

    updateHeaderProfile(headerElement, profileImage);

    await setCategoryOptions();

    if (modifyId) {
        isModifyMode = true;
        modifyData = await getBoardModifyData(modifyId);

        if (!modifyData.isOwner) {
            Dialog('권한 없음', '권한이 없습니다.', () => {
                window.location.href = '/';
            });
        } else {
            setModifyData(modifyData);
        }
    }

    addEvent();
    window.addEventListener('beforeunload', () => {
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    });
};

init();
