import { changePassword } from '../api/modifyPasswordRequest.js';
import Dialog from '../component/dialog/dialog.js';
import Header, {
    updateHeaderProfile,
} from '../component/header/header.js';
import {
    authCheck,
    getServerUrl,
    prependChild,
    resolveImageUrl,
    validPassword,
} from '../utils/function.js';
import { requestJson } from '../utils/request.js';
import { clearAuthStorage } from '../utils/token.js';

const button = document.querySelector('#signupBtn');

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const headerElement = Header('비밀번호 설정', 1, DEFAULT_PROFILE_IMAGE);
prependChild(document.body, headerElement);

const authResponse = await authCheck();
if (!authResponse.ok) throw new Error('사용자 정보를 불러오는데 실패하였습니다.');
const data = authResponse.data;
const profileImage = resolveImageUrl(
    data.profileImageUrl,
    DEFAULT_PROFILE_IMAGE,
);
updateHeaderProfile(headerElement, profileImage);

const modifyData = {
    password: '',
    passwordCheck: '',
};

const observeData = () => {
    const { password, passwordCheck } = modifyData;

    // id, pw, pwck, nickname, profile 값이 모두 존재하는지 확인
    if (!password || !passwordCheck || password !== passwordCheck) {
        button.disabled = true;
        button.style.backgroundColor = '#9ca5a9';
    } else {
        button.disabled = false;
        button.style.backgroundColor = '#122a38';
    }
};

const blurEventHandler = async (event, uid) => {
    if (uid == 'pw') {
        const value = event.target.value;
        const isValidPassword = validPassword(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        const helperElementCheck = document.querySelector(
            `.inputBox p[name="pwck"]`,
        );

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호를 입력해주세요.';
            helperElementCheck.textContent = '';
        } else if (!isValidPassword) {
            helperElement.textContent =
                '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
            helperElementCheck.textContent = '';
        } else {
            helperElement.textContent = '';
            modifyData.password = value;
        }
    } else if (uid == 'pwck') {
        const value = event.target.value;
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        // pw 입력란의 현재 값
        const password = modifyData.password;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호 한번 더 입력해주세요.';
        } else if (password !== value) {
            helperElement.textContent = '*비밀번호가 다릅니다.';
        } else {
            helperElement.textContent = '';
            modifyData.passwordCheck = value;
        }
    }

    observeData();
};

const addEventForInputElements = () => {
    const InputElement = document.querySelectorAll('input');
    InputElement.forEach(element => {
        const id = element.id;

        element.addEventListener('input', event => blurEventHandler(event, id));
    });
};

const modifyPassword = async () => {
    const { password } = modifyData;

    const { ok } = await changePassword(password);

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
        Dialog('비밀번호 변경 실패', '비밀번호 변경에 실패했습니다.', () => {
            location.href = '/html/modifyPassword.html';
        });
    }
};

const init = () => {
    button.addEventListener('click', modifyPassword);
    addEventForInputElements();
    observeData();
};

init();
