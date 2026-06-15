import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const userSignup = async data => {
    const result = await requestJson(`${getServerUrl()}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return result;
};

// 이메일/닉네임 중복 체크 API가 회원가입 API에서 분리되면 다시 사용
// export const checkEmail = async email => {
//     const result = await requestJson(
//         `${getServerUrl()}/users/email/check?email=${email}`,
//         {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         },
//     );
//     return result;
// };
//
// export const checkNickname = async nickname => {
//     const result = await requestJson(
//         `${getServerUrl()}/users/nickname/check?nickname=${nickname}`,
//         {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         },
//     );
//     return result;
// };

// 이미지 업로드 API가 백엔드에 추가되면 다시 사용
// export const fileUpload = async file => {
//     const result = await requestJson(
//         `${getServerUrl()}/users/upload/profile-image`,
//         {
//             method: 'POST',
//             body: file,
//         },
//     );
//     return result;
// };
