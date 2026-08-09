import { getServerUrl } from '../../utils/function.js';
import { requestJson } from '../../utils/request.js';
import { clearAuthStorage } from '../../utils/token.js';

const CATEGORIES = [
    { code: 'INFO', name: '정보' },
    { code: 'REVIEW', name: '후기' },
    { code: 'QNA', name: '질문' },
    { code: 'COMPANY', name: '동행' },
];

const CATEGORY_WRITE_LABELS = {
    INFO: '정보 공유하기',
    REVIEW: '피드 올리기',
    QNA: '질문하기',
    COMPANY: '동행 구하기',
};

export const getCategoryWriteLabel = categoryCode =>
    CATEGORY_WRITE_LABELS[categoryCode] || '새 글 올리기';

const headerDropdownMenu = () => {
    const wrap = document.createElement('div');

    const modifyInfoLink = document.createElement('a');
    const modifyPasswordLink = document.createElement('a');
    const logoutLink = document.createElement('a');

    modifyInfoLink.textContent = '회원정보수정';
    modifyPasswordLink.textContent = '비밀번호수정';
    logoutLink.textContent = '로그아웃';

    modifyInfoLink.href = '/html/modifyInfo.html';
    modifyPasswordLink.href = '/html/modifyPassword.html';
    logoutLink.addEventListener('click', async () => {
        try {
            await requestJson(`${getServerUrl()}/auth/logout`, {
                method: 'POST',
            });
        } finally {
            clearAuthStorage();
            location.href = '/html/login.html';
        }
    });

    wrap.classList.add('drop');

    wrap.appendChild(modifyInfoLink);
    wrap.appendChild(modifyPasswordLink);
    wrap.appendChild(logoutLink);

    return wrap;
};

// title : 헤더 타이틀
// leftBtn: 헤더 좌측 기능. 0 : None , 1: back , 2 : index
// rightBtn : 헤더 우측 기능. image 주소값 들어옴
const Header = (
    title,
    leftBtn = 0,
    profileImage = null,
) => {
    let leftBtnElement;
    let rightBtnElement;

    if (leftBtn == 1 || leftBtn == 2) {
        leftBtnElement = document.createElement('button');
        leftBtnElement.type = 'button';
        leftBtnElement.classList.add('backButton');
        leftBtnElement.setAttribute('aria-label', '이전 화면으로 이동');

        const backIcon = document.createElement('img');
        backIcon.classList.add('back');
        backIcon.src = '/public/navigate_before.svg';
        backIcon.alt = '';
        leftBtnElement.appendChild(backIcon);

        if (leftBtn == 1) {
            leftBtnElement.addEventListener('click', () => history.back());
        } else {
            leftBtnElement.addEventListener(
                'click',
                () => (location.href = '/'),
            );
        }
    }

    if (profileImage) {
        rightBtnElement = document.createElement('div');
        rightBtnElement.classList.add('profile');

        const profileElement = document.createElement('img');
        profileElement.classList.add('profile', 'headerProfileImage');
        profileElement.loading = 'eager';
        profileElement.src = profileImage;
        profileElement.alt = '내 프로필 메뉴';

        const Drop = headerDropdownMenu();
        Drop.classList.add('none');

        profileElement.addEventListener('click', event => {
            Drop.classList.toggle('none');
            event.stopPropagation();
        });

        rightBtnElement.appendChild(profileElement);
        rightBtnElement.appendChild(Drop);
    }

    const headerElement = document.createElement('header');
    headerElement.classList.add('siteHeader');

    const headerInner = document.createElement('div');
    headerInner.classList.add('headerInner');

    const headerStart = document.createElement('div');
    headerStart.classList.add('headerStart');
    if (leftBtnElement) headerStart.appendChild(leftBtnElement);

    const brand = document.createElement('a');
    brand.classList.add('brand');
    brand.href = '/';
    brand.setAttribute('aria-label', 'TRIPFEED 홈으로 이동');

    const brandName = document.createElement('span');
    brandName.classList.add('brandName');
    brandName.textContent = 'TRIPFEED';

    const brandTagline = document.createElement('span');
    brandTagline.classList.add('brandTagline');
    brandTagline.textContent = 'TRAVEL COMMUNITY';
    brand.appendChild(brandName);
    brand.appendChild(brandTagline);
    headerStart.appendChild(brand);

    const categoryNav = document.createElement('nav');
    categoryNav.classList.add('categoryNav');
    categoryNav.setAttribute(
        'aria-label',
        `${title || '여행 커뮤니티'} 카테고리`,
    );

    const activeCategoryCode = new URLSearchParams(
        window.location.search,
    ).get('categoryCode');

    CATEGORIES.forEach(category => {
        const categoryLink = document.createElement('a');
        categoryLink.classList.add('categoryLink');
        categoryLink.href = `/html/index.html?categoryCode=${category.code}`;
        categoryLink.textContent = category.name;
        categoryLink.dataset.categoryCode = category.code;

        if (activeCategoryCode === category.code) {
            categoryLink.classList.add('isActive');
            categoryLink.setAttribute('aria-current', 'page');
        }

        categoryNav.appendChild(categoryLink);
    });

    const headerActions = document.createElement('div');
    headerActions.classList.add('headerActions');

    if (profileImage) {
        const writeLink = document.createElement('a');
        writeLink.classList.add('headerWriteLink');
        writeLink.href = activeCategoryCode
            ? `/html/board-write.html?categoryCode=${activeCategoryCode}`
            : '/html/board-write.html';
        writeLink.textContent = getCategoryWriteLabel(activeCategoryCode);
        headerActions.appendChild(writeLink);
    }
    if (rightBtnElement) headerActions.appendChild(rightBtnElement);

    headerInner.appendChild(headerStart);
    headerInner.appendChild(categoryNav);
    headerInner.appendChild(headerActions);
    headerElement.appendChild(headerInner);

    return headerElement;
};

export const updateHeaderProfile = (headerElement, profileImage) => {
    const profileElement = headerElement?.querySelector('.headerProfileImage');
    if (profileElement && profileImage) {
        profileElement.src = profileImage;
    }
};

window.addEventListener('click', e => {
    const dropMenu = document.querySelector('.drop');
    if (dropMenu && !dropMenu.classList.contains('none')) {
        dropMenu.classList.add('none');
    }
});

export default Header;
