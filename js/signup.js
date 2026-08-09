import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheckReverse,
    prependChild,
    validEmail,
    validPassword,
    validNickname,
} from '../utils/function.js';
import { userSignup } from '../api/signupRequest.js';
// 이메일/닉네임 중복 체크 API가 회원가입 API에서 분리되면 다시 사용
// import { checkEmail, checkNickname } from '../api/signupRequest.js';
const MAX_PASSWORD_LENGTH = 20;
const DEFAULT_PROFILE_IMAGE_PATH = '/public/profile_default.svg';

const signupData = {
    email: '',
    password: '',
    nickname: '',
    profileImageUrl: undefined,
};

let isComposingNickname = false;

const getSignupData = () => {
    const { email, password, passwordCheck, nickname } = signupData;
    if (!email || !password || !passwordCheck || !nickname) {
        Dialog('필수 입력 사항', '모든 값을 입력해주세요.');
        return false;
    }

    sendSignupData();
};

const sendSignupData = async () => {
    const { passwordCheck, ...props } = signupData;
    props.profileImageUrl = `${window.location.origin}${DEFAULT_PROFILE_IMAGE_PATH}`;

    if (props.password.length > MAX_PASSWORD_LENGTH) {
        Dialog('비밀번호', '비밀번호는 20자 이하로 입력해주세요.');
        return;
    }
    // signupData를 서버로 전송
    const { ok, code } = await userSignup(props);

    // 응답이 성공적으로 왔을 경우
    if (ok || code === 'user_created') {
        Dialog('회원 가입 완료', '회원 가입이 완료되었습니다.', () => {
            location.href = '/html/login.html';
        });
    } else {
        if (code === 'email_already_exists') {
            const helperElement = document.querySelector(
                '.inputBox p[name="email"]',
            );
            if (helperElement)
                helperElement.textContent = '*중복된 이메일 입니다.';
            signupData.email = '';
        } else if (code === 'nickname_already_exists') {
            const helperElement = document.querySelector(
                '.inputBox p[name="nickname"]',
            );
            if (helperElement)
                helperElement.textContent = '*중복된 닉네임 입니다.';
            signupData.nickname = '';
        } else if (code === 'invalid_request') {
            Dialog('회원 가입 실패', '입력값을 확인해주세요.');
        } else {
            Dialog('회원 가입 실패', '잠시 뒤 다시 시도해 주세요', () => {});
        }
        observeSignupData();
    }
};

const signupClick = () => {
    // signup 버튼 클릭 시
    const signupBtn = document.querySelector('#signupBtn');
    signupBtn.addEventListener('click', getSignupData);
};

const inputEventHandler = async (event, uid) => {
    if (uid === 'nickname' && isComposingNickname) return;
    if (uid == 'email') {
        const value = event.target.value;
        const isValidEmail = validEmail(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*이메일을 입력해주세요.';
            signupData.email = '';
        } else if (!isValidEmail) {
            helperElement.textContent =
                '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)';
            signupData.email = '';
        } else {
            helperElement.textContent = '';
            signupData.email = value;

            // 이메일 중복 체크 API가 회원가입 API에서 분리되면 다시 사용
            // const { status } = await checkEmail(value);
            // if (status === 200) {
            //     helperElement.textContent = '';
            //     signupData.email = value;
            // } else {
            //     helperElement.textContent = '*중복된 이메일 입니다.';
            //     signupData.email = '';
            // }
        }
    } else if (uid == 'pw') {
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
            signupData.password = value;
        }
    } else if (uid == 'pwck') {
        const value = event.target.value;
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        // pw 입력란의 현재 값
        const password = signupData.password;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호 한번 더 입력해주세요.';
        } else if (password !== value) {
            helperElement.textContent = '*비밀번호가 다릅니다.';
        } else {
            signupData.passwordCheck = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'nickname') {
        const value = event.target.value;
        const isValidNickname = validNickname(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*닉네임을 입력해주세요.';
            signupData.nickname = '';
        } else if (value.includes(' ')) {
            helperElement.textContent = '*뛰어쓰기를 없애주세요.';
            signupData.nickname = '';
        } else if (value.length > 10) {
            helperElement.textContent =
                '*닉네임은 최대 10자까지 작성 가능합니다.';
            signupData.nickname = '';
        } else if (!isValidNickname) {
            helperElement.textContent =
                '*닉네임에 특수 문자는 사용할 수 없습니다.';
            signupData.nickname = '';
        } else {
            helperElement.textContent = '';
            signupData.nickname = value;

            // 닉네임 중복 체크 API가 회원가입 API에서 분리되면 다시 사용
            // const { status } = await checkNickname(value);
            // if (status === 200) {
            //     helperElement.textContent = '';
            //     signupData.nickname = value;
            // } else {
            //     helperElement.textContent = '*중복된 닉네임 입니다.';
            //     signupData.nickname = '';
            // }
        }
    }
    observeSignupData();
};

const addEventForInputElements = () => {
    const InputElement = document.querySelectorAll('input');
    InputElement.forEach(element => {
        const id = element.id;
        element.addEventListener('input', event =>
            inputEventHandler(event, id),
        );

        if (id === 'nickname') {
            element.addEventListener('compositionstart', () => {
                isComposingNickname = true;
            });
            element.addEventListener('compositionend', event => {
                isComposingNickname = false;
                inputEventHandler(event, id);
            });
        }
    });
};

const observeSignupData = () => {
    const { email, password, passwordCheck, nickname } = signupData;
    const button = document.querySelector('#signupBtn');

    if (
        !email ||
        !validEmail(email) ||
        !password ||
        !validPassword(password) ||
        !nickname ||
        !validNickname(nickname) ||
        !passwordCheck
    ) {
        button.disabled = true;
        button.style.backgroundColor = '#9ca5a9';
    } else {
        button.disabled = false;
        button.style.backgroundColor = '#0c1e2e';
    }
};

const init = async () => {
    await authCheckReverse();
    prependChild(document.body, Header('여행 커뮤니티', 1));
    observeSignupData();
    addEventForInputElements();
    signupClick();
};

init();
