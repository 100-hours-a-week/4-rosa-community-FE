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
// TODO: 이미지 업로드 API 연동 시 사용
// import { fileUpload } from '../api/board-writeRequest.js';

const HTTP_OK = 200;

const MAX_TITLE_LENGTH = 26;
const MAX_CONTENT_LENGTH = 1500;

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';

const submitButton = document.querySelector('#submit');
const titleInput = document.querySelector('#title');
const contentInput = document.querySelector('#content');
const categorySelect = document.querySelector('#category');
const imageInput = document.querySelector('#image');
const imagePreviewText = document.getElementById('imagePreviewText');
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

const observeSignupData = () => {
    const { categoryCode, title, content } = boardWrite;
    if (!categoryCode || !title || !content) {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#9ca5a9';
    } else {
        submitButton.disabled = false;
        submitButton.style.backgroundColor = '#0c1e2e';
    }
};

const getBoardData = () => {
    return {
        categoryCode: boardWrite.categoryCode,
        title: boardWrite.title,
        content: boardWrite.content,
        postImageUrl:
            localStorage.getItem('postFileUrl') === null
                ? null
                : localStorage.getItem('postFileUrl'),
        ...(isModifyMode ? { deleteImage } : {}),
    };
};

const addBoard = async () => {
    const boardData = getBoardData();

    if (!boardData) return Dialog('게시글', '게시글을 입력해주세요.');

    if (boardData.title.length > MAX_TITLE_LENGTH)
        return Dialog('게시글', '제목은 26자 이하로 입력해주세요.');

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
            localStorage.removeItem('postFileUrl');
            window.location.href = `/html/board.html?id=${postId}`;
            return;
        }

        const helperElement = contentHelpElement;
        helperElement.textContent = '제목, 내용을 모두 작성해주세요.';
    } else {
        const postId = getQueryString('postId');
        const setData = {
            ...boardData,
        };

        const { ok, status, code } = await updatePost(postId, setData);
        if (!ok) {
            const message =
                code === 'post_category_not_found'
                    ? '선택한 카테고리를 찾을 수 없습니다.'
                    : '게시글 수정에 실패했습니다.';
            Dialog('게시글 수정 실패', message);
            return;
        }

        if (status === HTTP_OK) {
            localStorage.removeItem('postFileUrl');
            window.location.href = `/html/board.html?id=${postId}`;
        } else {
            Dialog('게시글', '게시글 수정 실패');
        }
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
        localStorage.removeItem('postFileUrl');
        Dialog('이미지 업로드', '이미지 업로드는 아직 지원하지 않습니다.');
        event.target.value = '';

        // TODO: 이미지 업로드 API 연동 시 사용
        // const file = event.target.files[0];
        // if (!file) return;
        //
        // const formData = new FormData();
        // formData.append('postFile', file);
        //
        // const { ok, data } = await fileUpload(formData);
        // if (!ok) throw new Error('서버 응답 오류');
        // localStorage.setItem('postFileUrl', data.postImageUrl);
    } else if (uid === 'imagePreviewText') {
        localStorage.removeItem('postFileUrl');
        deleteImage = true;
        imagePreviewText.style.display = 'none';
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
    if (imagePreviewText !== null) {
        imagePreviewText.addEventListener('click', event =>
            changeEventHandler(event, 'imagePreviewText'),
        );
    }
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

    const postImageUrl = resolveImageUrl(data.postImageUrl);
    if (postImageUrl) {
        const fileName = postImageUrl.split('/').pop();
        imagePreviewText.innerHTML =
            fileName + `<span class="deleteFile">X</span>`;
        imagePreviewText.style.display = 'block';
        localStorage.setItem('postFileUrl', data.postImageUrl);
    } else {
        imagePreviewText.style.display = 'none';
    }

    boardWrite.categoryCode = data.category?.code || '';
    boardWrite.title = data.title;
    boardWrite.content = data.content;

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
    if (!modifyId) localStorage.removeItem('postFileUrl');

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
};

init();
