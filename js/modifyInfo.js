import Dialog from '../component/dialog/dialog.js';
import Header, {
    updateHeaderProfile,
} from '../component/header/header.js';
import {
    authCheck,
    getServerUrl,
    prependChild,
    resolveImageUrl,
    validNickname,
} from '../utils/function.js';
import { userModify, userDelete } from '../api/modifyInfoRequest.js';
import { requestJson } from '../utils/request.js';
import { clearAuthStorage } from '../utils/token.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const headerElement = Header('프로필 설정', 2, DEFAULT_PROFILE_IMAGE);
prependChild(document.body, headerElement);

// TODO: 닉네임 중복 체크 API 분리 시 사용
// import { checkNickname } from '../api/signupRequest.js';
// TODO: 이미지 업로드 API 연동 시 사용
// import { fileUpload } from '../api/signupRequest.js';

const emailTextElement = document.querySelector('#id');
const nicknameInputElement = document.querySelector('#nickname');
const profileInputElement = document.querySelector('#profile');
const withdrawBtnElement = document.querySelector('#withdrawBtn');
const nicknameHelpElement = document.querySelector(
    '.inputBox p[name="nickname"]',
);
const modifyBtnElement = document.querySelector('#signupBtn');
const profilePreview = document.querySelector('#profilePreview');
const removeProfileButton = document.querySelector('#removeProfileButton');
const authResponse = await authCheck();
if (!authResponse.ok) throw new Error('사용자 정보를 불러오는데 실패하였습니다.');
const authData = authResponse.data;
updateHeaderProfile(
    headerElement,
    resolveImageUrl(authData.profileImageUrl, DEFAULT_PROFILE_IMAGE),
);
const changeData = {
    nickname: authData.nickname,
    profileImageUrl: authData.profileImageUrl,
};

const setData = data => {
    if (!data.profileImageUrl) {
        profilePreview.src = DEFAULT_PROFILE_IMAGE;
        if (removeProfileButton) removeProfileButton.style.display = 'none';
    } else {
        profilePreview.src = resolveImageUrl(
            data.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );
        if (removeProfileButton) removeProfileButton.style.display = 'flex';
    }
    emailTextElement.textContent = data.email;
    nicknameInputElement.value = data.nickname;
};

const observeData = () => {
    const button = document.querySelector('#signupBtn');
    if (
        authData.nickname !== changeData.nickname ||
        authData.profileImageUrl !== changeData.profileImageUrl
    ) {
        button.disabled = false;
        button.style.backgroundColor = '#122a38';
    } else {
        button.disabled = true;
        button.style.backgroundColor = '#9ca5a9';
    }
};

const changeEventHandler = async (event, uid) => {
    if (uid == 'nickname') {
        const value = event.target.value;
        const isValidNickname = validNickname(value);
        const helperElement = nicknameHelpElement;
        if (value == '' || value == null) {
            helperElement.textContent = '*닉네임을 입력해주세요.';
            changeData.nickname = '';
        } else if (!isValidNickname) {
            helperElement.textContent =
                '*닉네임은 2~10자의 영문자, 한글 또는 숫자만 사용할 수 있습니다. 특수 문자와 띄어쓰기는 사용할 수 없습니다.';
            changeData.nickname = '';
        } else {
            helperElement.textContent = '';
            changeData.nickname = value;

            // TODO: 닉네임 중복 체크 API 분리 시 사용
            // const { status } = await checkNickname(value);
            // if (status === 200 || authData.nickname === value) {
            //     helperElement.textContent = '';
            //     changeData.nickname = value;
            // } else {
            //     helperElement.textContent = '*중복된 닉네임입니다.';
            //     changeData.nickname = authData.nickname;
            // }
        }
    } else if (uid == 'profile') {
        const file = event.target.files[0];
        if (!file) {
            localStorage.removeItem('profileImageUrl');
            profilePreview.src = DEFAULT_PROFILE_IMAGE;
            changeData.profileImageUrl = null;
            if (removeProfileButton) removeProfileButton.style.display = 'none';
            observeData();
            return;
        }

        Dialog('이미지 업로드', '이미지 업로드는 아직 지원하지 않습니다.');
        profileInputElement.value = '';

        // TODO: 이미지 업로드 API 연동 시 사용
        // const formData = new FormData();
        // formData.append('profileImage', file);
        //
        // const { ok, data } = await fileUpload(formData);
        // if (!ok) throw new Error('서버 응답 오류');
        // localStorage.setItem('profileImageUrl', data.profileImageUrl);
        // changeData.profileImageUrl = data.profileImageUrl;
        // profilePreview.src = resolveImageUrl(
        //     data.profileImageUrl,
        //     DEFAULT_PROFILE_IMAGE,
        // );
        // if (removeProfileButton) removeProfileButton.style.display = 'flex';
    }
    observeData();
};

const sendModifyData = async () => {
    const button = document.querySelector('#signupBtn');

    if (!button.disabled) {
        if (changeData.nickname === '') {
            Dialog('필수 정보 누락', '닉네임을 입력해주세요.');
        } else {
            const { ok, code } = await userModify(changeData);

            if (ok) {
                saveToastMessage('수정완료');
                location.href = '/html/modifyInfo.html';
            } else if (code === 'nickname_already_exists') {
                nicknameHelpElement.textContent = '*중복된 닉네임입니다.';
            } else {
                saveToastMessage('수정실패');
                location.href = '/html/modifyInfo.html';
            }
        }
    }
};

// 회원 탈퇴
const deleteAccount = async () => {
    const callback = async () => {
        const { ok } = await userDelete();

        if (ok) {
            try {
                await requestJson(`${getServerUrl()}/auth/logout`, {
                    method: 'POST',
                });
            } catch (error) {
                console.error('로그아웃 요청 실패:', error);
            }
            clearAuthStorage();
            location.href = '/html/login.html';
        } else {
            Dialog('회원 탈퇴 실패', '회원 탈퇴에 실패했습니다.');
        }
    };

    Dialog(
        '회원탈퇴 하시겠습니까?',
        '작성된 게시글과 댓글은 삭제 됩니다.',
        callback,
    );
};

const addEvent = () => {
    nicknameInputElement.addEventListener('change', event =>
        changeEventHandler(event, 'nickname'),
    );
    profileInputElement.addEventListener('change', event =>
        changeEventHandler(event, 'profile'),
    );
    if (removeProfileButton) {
        removeProfileButton.addEventListener('click', () => {
            localStorage.removeItem('profileImageUrl');
            profilePreview.src = DEFAULT_PROFILE_IMAGE;
            changeData.profileImageUrl = null;
            profileInputElement.value = '';
            removeProfileButton.style.display = 'none';
            observeData();
        });
    }
    modifyBtnElement.addEventListener('click', async () => sendModifyData());
    withdrawBtnElement.addEventListener('click', async () => deleteAccount());
};

const showToast = (message, duration = 3000, callback = null) => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.classList.add('toastMessage');
    toast.textContent = message;

    container.appendChild(toast);

    // 메시지를 보여주기
    setTimeout(() => {
        toast.style.opacity = 1;
        toast.style.bottom = '30px';
    }, 100);

    // 메시지 숨기기 및 콜백 실행
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.bottom = '20px';
        setTimeout(() => {
            toast.remove();
            if (callback) callback();
        }, 500);
    }, duration);
};

const saveToastMessage = message => {
    sessionStorage.setItem('toastMessage', message);
};

const displayToastFromStorage = () => {
    const message = sessionStorage.getItem('toastMessage');
    if (message) {
        showToast(message, 3000, () => {
            sessionStorage.removeItem('toastMessage');
        });
    }
};

const init = () => {
    setData(authData);
    observeData();
    addEvent();
    displayToastFromStorage();
};

init();
