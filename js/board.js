import CommentItem from '../component/comment/comment.js';
import Dialog from '../component/dialog/dialog.js';
import Header, {
    getCategoryWriteLabel,
    updateHeaderProfile,
} from '../component/header/header.js';
import {
    authCheck,
    prependChild,
    padTo2Digits,
    resolveImageUrl,
} from '../utils/function.js';
import {
    getPost,
    deletePost,
    writeComment,
    getComments,
    likePost,
} from '../api/boardRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const MAX_COMMENT_LENGTH = 1000;
const HTTP_NOT_AUTHORIZED = 401;
const HTTP_OK = 200;

const formatCount = value => {
    const count = Number(value);
    if (!Number.isFinite(count)) return value ?? '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
};

const setLikeButtonState = (button, isLiked) => {
    button.classList.toggle('is-active', isLiked);
    button.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
};

const getQueryString = name => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

const getBoardDetail = async postId => {
    const { ok, data } = await getPost(postId);
    if (!ok) throw new Error('게시글 정보를 가져오는데 실패하였습니다.');
    return data;
};

const setBoardDetail = data => {
    // 헤드 정보
    const categoryElement = document.querySelector('.detailCategory');
    const titleElement = document.querySelector('.title');
    const createdAtElement = document.querySelector('.createdAt');
    const imgElement = document.querySelector('.img');
    const nicknameElement = document.querySelector('.nickname');

    if (categoryElement) {
        categoryElement.textContent = data.category?.name || '여행 이야기';
        categoryElement.dataset.category = data.category?.code || '';
    }
    const activeCategoryLink = document.querySelector(
        `.categoryLink[data-category-code="${data.category?.code || ''}"]`,
    );
    if (activeCategoryLink) {
        activeCategoryLink.classList.add('isActive');
        activeCategoryLink.setAttribute('aria-current', 'page');
    }
    const headerWriteLink = document.querySelector('.headerWriteLink');
    if (headerWriteLink && data.category?.code) {
        headerWriteLink.href = `/html/board-write.html?categoryCode=${data.category.code}`;
        headerWriteLink.textContent = getCategoryWriteLabel(
            data.category.code,
        );
    }
    titleElement.textContent = data.title;
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    createdAtElement.textContent = formattedDate;

    imgElement.src = resolveImageUrl(
        data.author?.profileImageUrl,
        DEFAULT_PROFILE_IMAGE,
    );

    nicknameElement.textContent = data.author?.nickname || '';

    // 바디 정보
    const contentImgElement = document.querySelector('.contentImg');
    const postImageUrl = resolveImageUrl(data.postImageUrl);
    if (postImageUrl) {
        const img = document.createElement('img');
        img.src = postImageUrl;
        contentImgElement.appendChild(img);
    }
    const contentElement = document.querySelector('.content');
    contentElement.textContent = data.content;

    const likeButtonElement = document.querySelector('.likeButton');
    const likeCountElement = likeButtonElement.querySelector('h3');
    let isLiked = Boolean(data.liked);
    let isLikeLoading = false;

    likeCountElement.textContent = formatCount(data.likeCount);
    setLikeButtonState(likeButtonElement, isLiked);

    likeButtonElement.addEventListener('click', async () => {
        if (isLikeLoading) return;
        isLikeLoading = true;

        try {
            const { ok, status, data: likeData } = await likePost(data.id);
            if (ok) {
                isLiked = Boolean(likeData?.liked);
                setLikeButtonState(likeButtonElement, isLiked);
                if (likeData && likeData.likeCount !== undefined) {
                    likeCountElement.textContent = formatCount(
                        likeData.likeCount,
                    );
                }
            } else if (status === HTTP_NOT_AUTHORIZED) {
                window.location.href = '/html/login.html';
            } else {
                Dialog('좋아요 실패', '좋아요 처리에 실패하였습니다.');
            }
        } finally {
            isLikeLoading = false;
        }
    });

    const viewCountElement = document.querySelector('.viewCount h3');
    viewCountElement.textContent = formatCount(data.viewCount);

    const commentCountElement = document.querySelector('.commentCount h3');
    commentCountElement.textContent = data.commentCount.toLocaleString();
};

const isPostOwner = data => {
    return data.isOwner || data.owner || data.is_owner;
};

const setBoardModify = data => {
    if (isPostOwner(data)) {
        const modifyElement = document.querySelector('.hidden');
        modifyElement.classList.remove('hidden');

        const modifyBtnElement = document.querySelector('#deleteBtn');
        const postId = getQueryString('id');
        modifyBtnElement.addEventListener('click', () => {
            Dialog(
                '게시글을 삭제하시겠습니까?',
                '삭제한 내용은 복구 할 수 없습니다.',
                async () => {
                    const { ok } = await deletePost(postId);
                    if (ok) {
                        window.location.href = '/';
                    } else {
                        Dialog('삭제 실패', '게시글 삭제에 실패하였습니다.');
                    }
                },
            );
        });

        const modifyBtnElement2 = document.querySelector('#modifyBtn');
        modifyBtnElement2.addEventListener('click', () => {
            window.location.href = `/html/board-modify.html?postId=${data.id}`;
        });
    }
};

const getBoardComment = async id => {
    const { ok, status, data } = await getComments(id);
    if (!ok) return [];
    if (status !== HTTP_OK) return [];
    return data?.content || [];
};

const setBoardComment = (data, myInfo, postId) => {
    const commentListElement = document.querySelector('.commentList');
    if (commentListElement) {
        data.map(event => {
            const item = CommentItem(
                event,
                postId,
                event.id,
                myInfo,
            );
            commentListElement.appendChild(item);
        });
    }
};

const addComment = async () => {
    const comment = document.querySelector('textarea').value;
    const pageId = getQueryString('id');

    const { ok } = await writeComment(pageId, comment);

    if (ok) {
        window.location.reload();
    } else {
        Dialog('댓글 등록 실패', '댓글 등록에 실패하였습니다.');
    }
};

const inputComment = async () => {
    const textareaElement = document.querySelector(
        '.commentInputWrap textarea',
    );
    const commentBtnElement = document.querySelector('.commentInputBtn');

    if (textareaElement.value.length > MAX_COMMENT_LENGTH) {
        textareaElement.value = textareaElement.value.substring(
            0,
            MAX_COMMENT_LENGTH,
        );
    }
    if (textareaElement.value === '') {
        commentBtnElement.disabled = true;
        commentBtnElement.style.backgroundColor = '#9ca5a9';
    } else {
        commentBtnElement.disabled = false;
        commentBtnElement.style.backgroundColor = '#122a38';
    }
};

const init = async () => {
    const headerElement = Header(
        '여행 이야기',
        2,
        DEFAULT_PROFILE_IMAGE,
    );
    prependChild(document.body, headerElement);

    try {
        const authResult = await authCheck();
        if (!authResult.ok) return;

        const myInfo = authResult.data;
        const commentBtnElement = document.querySelector('.commentInputBtn');
        const textareaElement = document.querySelector(
            '.commentInputWrap textarea',
        );
        textareaElement.addEventListener('input', inputComment);
        commentBtnElement.addEventListener('click', addComment);
        commentBtnElement.disabled = true;
        const profileImage = resolveImageUrl(
            myInfo.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );

        updateHeaderProfile(headerElement, profileImage);

        const pageId = getQueryString('id');

        const pageData = await getBoardDetail(pageId);

        if (isPostOwner(pageData)) {
            setBoardModify(pageData);
        }
        setBoardDetail(pageData);

        getBoardComment(pageId).then(data =>
            setBoardComment(data, myInfo, pageId),
        );
    } catch (error) {
        console.error(error);
    }
};

init();
