import { padTo2Digits, resolveImageUrl } from '../../utils/function.js';

const BoardItem = (
    postId,
    date,
    title,
    viewCount,
    imgUrl,
    writer,
    commentCount,
    likeCount,
    category,
    postImageUrl,
    content = '',
) => {
    // 파라미터 값이 없으면 리턴
    if (
        !date ||
        !title ||
        viewCount === undefined ||
        likeCount === undefined ||
        commentCount === undefined ||
        !writer
    ) {
        return;
    }

    // 날짜 포맷 변경 YYYY-MM-DD hh:mm:ss
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();

    const formattedDate = `${year}.${padTo2Digits(month)}.${padTo2Digits(day)}`;

    const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
    const DEFAULT_POST_IMAGE = '/public/background/tripfeed_hero.jpg';
    const profileImageUrl = resolveImageUrl(imgUrl, DEFAULT_PROFILE_IMAGE);
    const thumbnailUrl = resolveImageUrl(postImageUrl, DEFAULT_POST_IMAGE);
    const excerpt = content || '여행자가 직접 전하는 새로운 이야기를 확인해 보세요.';
    const categoryCode = category?.code || 'REVIEW';
    const categoryName = category?.name || '후기';
    // const API_HOST = getServerUrl();

    return `
    <a href="/html/board.html?id=${postId}">
        <div class="boardItem">
            <div class="boardThumbnail">
                <img src="${thumbnailUrl}" alt="" loading="lazy">
                <span class="storyBadge" data-category="${categoryCode}">${categoryName}</span>
            </div>
            <div class="boardContent">
                <span class="listCategoryBadge" data-category="${categoryCode}">${categoryName}</span>
                <div class="boardCopy">
                    <h2 class="title">${title}</h2>
                    <p class="boardExcerpt">${excerpt}</p>
                </div>
                <div class="boardMeta">
                    <div class="writerInfo">
                        <picture class="img">
                            <img src="${profileImageUrl}" alt="${writer}" loading="lazy">
                        </picture>
                        <div class="writerText">
                            <h3 class="writer">${writer}</h3>
                            <p class="date">${formattedDate}</p>
                        </div>
                    </div>
                    <div class="info" aria-label="게시글 통계">
                        <span title="좋아요">
                            <svg class="statIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <use href="/public/icons/post-stats.svg#heart"></use>
                            </svg>
                            <b>${likeCount}</b>
                        </span>
                        <span title="댓글">
                            <svg class="statIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <use href="/public/icons/post-stats.svg#comment"></use>
                            </svg>
                            <b>${commentCount}</b>
                        </span>
                        <span title="조회수">
                            <svg class="statIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <use href="/public/icons/post-stats.svg#view"></use>
                            </svg>
                            <b>${viewCount}</b>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </a>
`;
};

export default BoardItem;
