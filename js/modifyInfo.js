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
import {
    createImagePreviewUrl,
    prepareImageFile,
    uploadImage,
} from '../api/imageRequest.js';
import { requestJson } from '../utils/request.js';
import { clearAuthStorage } from '../utils/token.js';

const DEFAULT_PROFILE_IMAGE = '/public/profile_default.svg';
const DEFAULT_PROFILE_IMAGE_URL = `${window.location.origin}${DEFAULT_PROFILE_IMAGE}`;
const headerElement = Header('프로필 설정', 2, DEFAULT_PROFILE_IMAGE);
prependChild(document.body, headerElement);

// TODO: 닉네임 중복 체크 API 분리 시 사용
// import { checkNickname } from '../api/signupRequest.js';
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
const profileUploadNotice = document.querySelector('#profileUploadNotice');
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
let selectedProfileFile = null;
let localProfilePreviewUrl = null;
let isSubmitting = false;
let isPreparingProfileImage = false;

const isDefaultProfileImage = imageUrl => {
    return (
        !imageUrl ||
        imageUrl.includes('/profile_default.svg') ||
        imageUrl.includes('/image/profile/default.jpg')
    );
};

const setProfileUploadNotice = (message, isError = false) => {
    if (!profileUploadNotice) return;
    profileUploadNotice.textContent = message;
    profileUploadNotice.style.color = isError
        ? 'var(--color-danger)'
        : 'var(--color-muted)';
};

profilePreview.onerror = () => {
    profilePreview.onerror = null;
    profilePreview.src = DEFAULT_PROFILE_IMAGE;
    setProfileUploadNotice('기존 프로필 이미지를 불러오지 못했어요.', true);
};

const setData = data => {
    if (isDefaultProfileImage(data.profileImageUrl)) {
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
    const hasChanges =
        authData.nickname !== changeData.nickname ||
        authData.profileImageUrl !== changeData.profileImageUrl ||
        Boolean(selectedProfileFile);

    if (
        !isSubmitting &&
        !isPreparingProfileImage &&
        changeData.nickname &&
        hasChanges
    ) {
        modifyBtnElement.disabled = false;
        modifyBtnElement.style.backgroundColor = '#0c1e2e';
    } else {
        modifyBtnElement.disabled = true;
        modifyBtnElement.style.backgroundColor = '#9ca5a9';
    }
};

const setSubmitting = value => {
    isSubmitting = value;
    profileInputElement.disabled = value;
    if (removeProfileButton) removeProfileButton.disabled = value;
    modifyBtnElement.textContent = value
        ? selectedProfileFile
            ? '이미지 저장 중...'
            : '수정 중...'
        : '수정하기';
    observeData();
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
        if (!file) return;

        if (/\.(heic|heif)$/i.test(file.name)) {
            setProfileUploadNotice('HEIC 이미지를 JPEG로 변환 중입니다.');
        }
        isPreparingProfileImage = true;
        profileInputElement.disabled = true;
        observeData();
        const prepared = await prepareImageFile(file);
        isPreparingProfileImage = false;
        profileInputElement.disabled = false;
        if (!prepared.ok) {
            profileInputElement.value = '';
            setProfileUploadNotice(prepared.message, true);
            Dialog('이미지 선택 실패', prepared.message);
            observeData();
            return;
        }

        selectedProfileFile = prepared.file;
        try {
            if (localProfilePreviewUrl)
                URL.revokeObjectURL(localProfilePreviewUrl);
            localProfilePreviewUrl = createImagePreviewUrl(file);
            profilePreview.src = localProfilePreviewUrl;
            if (removeProfileButton)
                removeProfileButton.style.display = 'flex';
            setProfileUploadNotice(
                prepared.converted
                    ? 'HEIC 이미지를 JPEG로 변환했어요. 수정할 때 저장됩니다.'
                    : '수정할 때 프로필 이미지가 함께 저장됩니다.',
            );
        } catch (error) {
            selectedProfileFile = null;
            profileInputElement.value = '';
            setProfileUploadNotice(
                '이미지 미리보기를 만들지 못했어요.',
                true,
            );
            Dialog(
                '이미지 선택 실패',
                '이미지 파일을 다시 선택해 주세요.',
            );
        }
    }
    observeData();
};

const sendModifyData = async () => {
    if (!modifyBtnElement.disabled && !isSubmitting) {
        if (changeData.nickname === '') {
            Dialog('필수 정보 누락', '닉네임을 입력해주세요.');
        } else {
            setSubmitting(true);
            try {
                if (selectedProfileFile) {
                    const uploadResult = await uploadImage(
                        selectedProfileFile,
                        'PROFILE',
                    );
                    if (!uploadResult.ok) {
                        setProfileUploadNotice(uploadResult.message, true);
                        Dialog('이미지 업로드 실패', uploadResult.message);
                        return;
                    }
                    changeData.profileImageUrl = uploadResult.data.imageUrl;
                    selectedProfileFile = null;
                }

                const { ok, code } = await userModify(changeData);

                if (ok) {
                    saveToastMessage('수정완료');
                    location.href = '/html/modifyInfo.html';
                } else if (code === 'nickname_already_exists') {
                    nicknameHelpElement.textContent = '*중복된 닉네임입니다.';
                } else {
                    Dialog(
                        '회원정보 수정 실패',
                        '잠시 뒤 다시 시도해 주세요.',
                    );
                }
            } finally {
                setSubmitting(false);
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
            if (localProfilePreviewUrl) {
                URL.revokeObjectURL(localProfilePreviewUrl);
                localProfilePreviewUrl = null;
            }
            selectedProfileFile = null;
            profilePreview.src = DEFAULT_PROFILE_IMAGE;
            changeData.profileImageUrl = DEFAULT_PROFILE_IMAGE_URL;
            profileInputElement.value = '';
            removeProfileButton.style.display = 'none';
            setProfileUploadNotice('기본 프로필 이미지로 변경됩니다.');
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
    window.addEventListener('beforeunload', () => {
        if (localProfilePreviewUrl)
            URL.revokeObjectURL(localProfilePreviewUrl);
    });
};

init();
