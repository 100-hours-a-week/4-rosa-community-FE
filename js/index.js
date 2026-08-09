import BoardItem from '../component/board/boardItem.js';
import Dialog from '../component/dialog/dialog.js';
import Header, {
    getCategoryWriteLabel,
    updateHeaderProfile,
} from '../component/header/header.js';
import { authCheck, prependChild, resolveImageUrl } from '../utils/function.js';
import { getPosts } from '../api/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const SCROLL_THRESHOLD = 0.9;
const DEFAULT_SORT = 'recent';
const CATEGORY_NAMES = {
    INFO: '정보',
    REVIEW: '후기',
    QNA: '질문',
    COMPANY: '동행',
};
const requestedCategoryCode = new URLSearchParams(
    window.location.search,
).get('categoryCode');
const currentCategoryCode = Object.hasOwn(
    CATEGORY_NAMES,
    requestedCategoryCode,
)
    ? requestedCategoryCode
    : null;
let currentKeyword = '';
let currentSort = DEFAULT_SORT;
let nextCursor = null;
let isEnd = false;
let isProcessing = false;

const updateSortVisibility = () => {
    const sortRow = document.querySelector('#searchSortRow');
    if (!sortRow) return;
    const isSearching = currentKeyword.trim().length > 0;
    sortRow.classList.toggle('isHidden', !isSearching);
    sortRow.setAttribute('aria-hidden', String(!isSearching));
};

// getBoardItem 함수
const getBoardItem = async (cursor = null) => {
    const result = await getPosts(cursor, currentCategoryCode);
    if (!result.ok) {
        throw new Error('Failed to load post list.');
    }
    return result.data;
};

const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    if (boardList && boardData) {
        const itemsHtml = boardData
            .map(data =>
                BoardItem(
                    data.id,
                    data.createdAt,
                    data.title,
                    data.viewCount,
                    data.author ? data.author.profileImageUrl : null,
                    data.author ? data.author.nickname : null,
                    data.commentCount,
                    data.likeCount,
                    data.category,
                    data.postImageUrl,
                    data.content,
                ),
            )
            .join('');
        boardList.innerHTML += ` ${itemsHtml}`;
    }
};

const setCategoryHeading = () => {
    const eyebrow = document.querySelector('#feedEyebrow');
    const title = document.querySelector('#feedTitle');
    const description = document.querySelector('#feedDescription');
    const writeLink = document.querySelector('#writeLink');
    const headings = {
        INFO: {
            eyebrow: 'TRAVEL INFO',
            title: '여행 정보',
            description: '여행 전에 필요한 정보를 찾고, 나만의 팁도 나눠보세요.',
        },
        REVIEW: {
            eyebrow: 'TRAVEL FEED',
            title: '여행 기록 피드',
            description: '사진으로 남긴 여행을 공유하고 나만의 피드를 채워보세요.',
        },
        QNA: {
            eyebrow: 'TRAVEL Q&A',
            title: '여행 질문',
            description: '궁금한 건 묻고, 먼저 다녀온 여행자의 답을 확인하세요.',
        },
        COMPANY: {
            eyebrow: 'TRAVEL COMPANIONS',
            title: '여행 동행',
            description: '일정과 취향이 맞는 여행자를 찾아 함께 떠나보세요.',
        },
    };

    if (!currentCategoryCode) return;

    const heading = headings[currentCategoryCode];

    if (eyebrow) eyebrow.textContent = heading.eyebrow;
    if (title) title.textContent = heading.title;
    if (description) description.textContent = heading.description;
    if (writeLink) {
        writeLink.href = `/html/board-write.html?categoryCode=${currentCategoryCode}`;
        writeLink.textContent = getCategoryWriteLabel(currentCategoryCode);
    }
};

const setBoardLayout = () => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;

    const isReviewFeed = currentCategoryCode === 'REVIEW';
    const isCategoryPage = Boolean(currentCategoryCode);
    boardList.classList.toggle('reviewFeed', isReviewFeed);
    boardList.classList.toggle('listFeed', !isReviewFeed);
    document.documentElement.classList.toggle(
        'categoryPage',
        isCategoryPage,
    );
    document
        .querySelector('.feedHero')
        ?.classList.toggle('isHidden', isCategoryPage);
};

const resetBoardList = () => {
    const boardList = document.querySelector('.boardList');
    if (boardList) {
        boardList.innerHTML = '';
    }
};

const renderSkeleton = () => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;

    const skeletonCount = currentCategoryCode === 'REVIEW' ? 6 : 4;
    boardList.setAttribute('aria-busy', 'true');
    boardList.innerHTML = Array.from(
        { length: skeletonCount },
        () => `
            <article class="boardSkeleton" aria-hidden="true">
                <div class="skeletonThumbnail skeletonBlock"></div>
                <div class="skeletonContent">
                    <span class="skeletonBadge skeletonBlock"></span>
                    <div class="skeletonCopy">
                        <span class="skeletonTitle skeletonBlock"></span>
                        <span class="skeletonLine skeletonBlock"></span>
                    </div>
                    <div class="skeletonMeta">
                        <div class="skeletonAuthor">
                            <span class="skeletonAvatar skeletonBlock"></span>
                            <span class="skeletonAuthorLine skeletonBlock"></span>
                        </div>
                        <span class="skeletonStats skeletonBlock"></span>
                    </div>
                </div>
            </article>
        `,
    ).join('');
};

const renderLoadErrorState = () => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;

    boardList.innerHTML = `
        <div class="emptyState">
            <span>!</span>
            <h3>글을 불러오지 못했어요.</h3>
            <p>잠시 후 새로고침해 주세요.</p>
        </div>
    `;
};

const renderEmptyState = () => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;

    const emptyPostName = currentCategoryCode
        ? `${CATEGORY_NAMES[currentCategoryCode]}글`
        : '게시글';
    const writeLabel = getCategoryWriteLabel(currentCategoryCode);
    boardList.innerHTML = `
        <div class="emptyState">
            <span>✦</span>
            <h3>아직 ${emptyPostName}이 없어요.</h3>
            <p>첫 번째 이야기를 들려주세요.</p>
            <a href="/html/board-write.html${currentCategoryCode ? `?categoryCode=${currentCategoryCode}` : ''}">${writeLabel}</a>
        </div>
    `;
};

const loadBoardItems = async ({ reset = false } = {}) => {
    if (isProcessing || (!reset && isEnd)) return;
    isProcessing = true;

    try {
        if (reset) {
            nextCursor = null;
            isEnd = false;
            renderSkeleton();
        }
        const page = await getBoardItem(nextCursor);
        const items = page?.content || [];
        if (reset) resetBoardList();
        if (!items || items.length === 0) {
            isEnd = true;
            if (reset) renderEmptyState();
            return;
        }
        setBoardItem(items);
        nextCursor = page.nextCursor;
        isEnd = !page.hasNext;
    } catch (error) {
        console.error('Error fetching items:', error);
        isEnd = true;
        if (reset) renderLoadErrorState();
    } finally {
        isProcessing = false;
        document.querySelector('.boardList')?.setAttribute('aria-busy', 'false');
    }
};

const addSearchEvent = () => {
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('.searchButton');
    if (!searchInput || !searchButton) return;

    const runSearch = async () => {
        const trimmedKeyword = searchInput.value.trim();
        if (trimmedKeyword.length > 0) {
            Dialog('검색 실패', '검색 API가 아직 제공되지 않습니다.');
            return;
        }
        currentKeyword = trimmedKeyword;
        updateSortVisibility();
        await loadBoardItems({ reset: true });
    };

    searchButton.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runSearch();
        }
    });
};

const addSortEvent = () => {
    const sortSelect = document.querySelector('#searchSortSelect');
    if (!sortSelect) return;
    sortSelect.value = currentSort;

    sortSelect.addEventListener('change', async () => {
        currentSort = sortSelect.value || DEFAULT_SORT;
        if (currentKeyword.trim().length === 0) return;
        await loadBoardItems({ reset: true });
    });
};

// 스크롤 이벤트 추가
const addInfinityScrollEvent = () => {
    window.addEventListener('scroll', async () => {
        const hasScrolledToThreshold =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight * SCROLL_THRESHOLD;
        if (hasScrolledToThreshold) {
            loadBoardItems();
        }
    });
};

const init = async () => {
    const headerElement = Header(
        '여행 커뮤니티',
        0,
        DEFAULT_PROFILE_IMAGE,
    );
    prependChild(document.body, headerElement);

    setCategoryHeading();
    setBoardLayout();
    updateSortVisibility();
    renderSkeleton();

    try {
        const authResult = await authCheck();
        if (!authResult.ok) return;

        const profileImageUrl = resolveImageUrl(
            authResult.data?.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );

        updateHeaderProfile(headerElement, profileImageUrl);

        await loadBoardItems({ reset: true });

        addSearchEvent();
        addSortEvent();
        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
