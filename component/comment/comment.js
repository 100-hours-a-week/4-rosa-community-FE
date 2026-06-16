import { resolveImageUrl, padTo2Digits } from '../../utils/function.js';
import Dialog from '../dialog/dialog.js';
import { deleteComment, updateComment } from '../../api/commentRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';

const normalizeId = value => {
    if (value === undefined || value === null) return null;
    return String(value);
};

const getFirstValue = values => {
    return values.find(value => value !== undefined && value !== null);
};

const isTruthyOwner = value => value === true || value === 'true' || value === 1;

const isCommentOwner = (data, myInfo) => {
    if (
        isTruthyOwner(data.isOwner) ||
        isTruthyOwner(data.owner) ||
        isTruthyOwner(data.is_owner)
    ) {
        return true;
    }

    const commentOwnerId = normalizeId(
        getFirstValue([
            data.userId,
            data.writerId,
            data.authorId,
            data.memberId,
            data.user?.id,
            data.user?.userId,
            data.author?.id,
            data.author?.userId,
            data.author?.idx,
            data.author?.memberId,
        ]),
    );
    const myId = normalizeId(
        getFirstValue([
            myInfo?.id,
            myInfo?.userId,
            myInfo?.idx,
            myInfo?.memberId,
        ]),
    );

    if (commentOwnerId && myId && commentOwnerId === myId) {
        return true;
    }

    return Boolean(
        data.author?.nickname &&
            myInfo?.nickname &&
            data.author.nickname === myInfo.nickname,
    );
};

const CommentItem = (data, postId, commentId, myInfo) => {
    const CommentDelete = () => {
        Dialog(
            '댓글을 삭제하시겠습니까?',
            '삭제한 내용은 복구 할 수 없습니다.',
            async () => {
                const { ok } = await deleteComment(commentId);
                if (!ok) {
                    Dialog('삭제 실패', '댓글 삭제에 실패하였습니다.');
                    return;
                }

                location.href = '/html/board.html?id=' + postId;
            },
        );
    };

    const CommentModify = () => {
        // 댓글 내용을 보여주는 p 태그 찾기
        const p = commentInfoWrap.querySelector('p');
        if (!p) return;

        // 현재 댓글 내용 저장
        const originalContent = p.innerHTML.replace(/<br>/g, '\n');

        // textarea 생성 및 설정
        const textarea = document.createElement('textarea');
        textarea.className = 'commentEditTextarea';
        textarea.value = originalContent;
        textarea.maxLength = 1500;

        // 사용자가 입력할 때마다 글자 수 체크
        textarea.addEventListener('input', () => {
            if (textarea.value.length > 1500) {
                textarea.value = textarea.value.substring(0, 1500);
            }
        });

        const editWrap = document.createElement('div');
        editWrap.className = 'commentEditWrap';

        const editActions = document.createElement('div');
        editActions.className = 'commentEditActions';

        // 수정 완료(저장) 버튼 생성 및 설정
        const saveButton = document.createElement('button');
        saveButton.className = 'commentEditSave';
        saveButton.textContent = '저장';
        saveButton.onclick = async () => {
            if (textarea.value.length === 0) {
                Dialog('수정 실패', '댓글은 1자 이상 입력해주세요.');
                return;
            }
            const updatedContent = textarea.value;
            const { ok } = await updateComment(commentId, updatedContent);
            if (!ok)
                return Dialog('수정 실패', '댓글 수정에 실패하였습니다.');

            location.href = '/html/board.html?id=' + postId;
        };

        // 취소 버튼 생성 및 설정
        const cancelButton = document.createElement('button');
        cancelButton.className = 'commentEditCancel';
        cancelButton.textContent = '취소';
        cancelButton.onclick = () => {
            p.innerHTML = originalContent.replace(/\n/g, '<br>');
            commentInfoWrap.replaceChild(p, editWrap);
        };

        editActions.appendChild(cancelButton);
        editActions.appendChild(saveButton);
        editWrap.appendChild(textarea);
        editWrap.appendChild(editActions);

        // p 태그를 편집 영역으로 대체
        commentInfoWrap.replaceChild(editWrap, p);
    };

    const commentItem = document.createElement('div');
    commentItem.className = 'commentItem';

    const picture = document.createElement('picture');

    const img = document.createElement('img');
    img.className = 'commentImg';
    img.src = resolveImageUrl(
        data.author && data.author.profileImageUrl,
        DEFAULT_PROFILE_IMAGE,
    );
    picture.appendChild(img);

    const commentInfoWrap = document.createElement('div');
    commentInfoWrap.className = 'commentInfoWrap';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'commentInfoHeader';

    const h3 = document.createElement('h3');
    h3.textContent = data.author ? data.author.nickname : '';
    infoDiv.appendChild(h3);

    const h4 = document.createElement('h4');
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    h4.textContent = formattedDate;
    infoDiv.appendChild(h4);

    if (isCommentOwner(data, myInfo)) {
        const buttonWrap = document.createElement('span');

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.onclick = CommentDelete;
        const modifyButton = document.createElement('button');
        modifyButton.textContent = '수정';
        modifyButton.onclick = CommentModify;

        buttonWrap.appendChild(modifyButton);
        buttonWrap.appendChild(deleteButton);

        infoDiv.appendChild(buttonWrap);
    }

    const p = document.createElement('p');
    p.innerHTML = data.content.replace(/(?:\r\n|\r|\n)/g, '<br>');

    commentInfoWrap.appendChild(infoDiv);
    commentInfoWrap.appendChild(p);

    commentItem.appendChild(picture);
    commentItem.appendChild(commentInfoWrap);

    return commentItem;
};

export default CommentItem;
