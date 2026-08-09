<div align="center">

# T R I P F E E D

**여행 정보 공유와 동행 모집을 위한 커뮤니티**

여행 정보, 후기, 질문을 공유하고  
일정에 맞는 동행을 찾을 수 있습니다.

[![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=000000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Markup-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Styling-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

<div align="center">

<img width="1469" height="870" alt="TRIPFEED 메인 화면" src="https://github.com/user-attachments/assets/867de4a0-9223-407b-839d-eeccc5e73294" />

</div>

---

## Service Overview

**TRIPFEED**는 여행 정보를 공유하고 동행을 모집할 수 있는 커뮤니티 서비스입니다.

사용자는 여행 정보와 후기를 작성하고, 궁금한 내용을 질문하거나 여행 일정에 맞는 동행을 구할 수 있습니다.  
특히 후기 페이지는 이미지 중심의 피드 형식으로 제공된다는 특징이 있습니다.

이 저장소는 Vanilla JavaScript 기반 커뮤니티 프론트엔드 구조를 바탕으로, TRIPFEED 서비스에 맞게 백엔드 API 연동, 여행 카테고리, UI/UX, 이미지 업로드와 배포 구성을 확장한 프로젝트입니다.

### Community Boards

| 🗺️ 정보 | 📸 후기 | 💬 질문 | 🧳 동행 |
| :---: | :---: | :---: | :---: |
| 여행지 정보를 공유합니다 | 여행을 피드 형식으로 기록합니다 | 여행 관련 질문을 등록합니다 | 일정에 맞는 동행을 모집합니다 |

## Main Changes

- 자체 Spring Boot 백엔드 API 규격에 맞춘 기능 연동
- 정보·후기·질문·동행 카테고리와 카테고리별 화면 구성
- 여행 커뮤니티 콘셉트에 맞춘 전반적인 UI/UX 개편
- S3 Presigned URL 기반 게시글·프로필 이미지 업로드 적용
- Node.js·Nginx·Docker Compose 기반 프론트 배포 구성

## Screenshots

| 메인 페이지 | 후기 피드 페이지 | 피드 게시글 상세 페이지 |
| :---: | :---: | :---: |
| <img width="1470" height="872" alt="TRIPFEED 메인 페이지" src="https://github.com/user-attachments/assets/302adddf-89ce-46b1-b111-da7f0d8b4c62" /> | <img width="1470" height="871" alt="TRIPFEED 후기 피드 페이지" src="https://github.com/user-attachments/assets/8c5a0435-0824-4aa1-b5b3-366e4530c685" /> | <img width="1470" height="870" alt="TRIPFEED 후기 상세 페이지" src="https://github.com/user-attachments/assets/7d70682b-f0fb-4ee4-976b-b0b90cc0176d" /> |

## Demo

https://github.com/user-attachments/assets/dbd216d5-8020-4e57-ae1d-73f2d049f217

## Core Features

| 기능 | 설명 |
| --- | --- |
| **회원 및 인증** | 회원가입·로그인 폼 검증, 보호 페이지 접근 제어, 로그아웃과 회원 탈퇴 |
| **토큰 관리** | 액세스 토큰을 메모리에서 관리하고, 401 응답 시 HttpOnly 쿠키를 이용해 토큰을 자동 재발급한 뒤 요청 재시도 |
| **카테고리 피드** | 정보·후기·질문·동행 카테고리별 화면과 목적에 맞는 글쓰기 동선 제공 |
| **게시글 목록** | 커서 기반 페이지네이션을 무한 스크롤 UI로 연결하고 로딩·빈 목록·오류 상태 제공 |
| **게시글 상세** | 게시글 조회·작성·수정·삭제, 댓글 작성·수정·삭제와 좋아요 토글 지원 |
| **후기 UI** | 후기 게시판과 상세 화면을 사진 중심의 피드 레이아웃으로 구성 |
| **이미지 업로드** | 파일 검증과 미리보기, HEIC·HEIF의 JPEG 변환, S3 Presigned URL 직접 업로드 지원 |
| **사용자 설정** | 프로필 이미지·닉네임·비밀번호 수정과 기본 프로필 복원 지원 |
| **반응형 UX** | 화면 크기에 대응하는 레이아웃, 스켈레톤 UI와 사용자 피드백 상태 제공 |

## Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Web Server | Node.js, Express |
| Image Storage | Amazon S3 |
| Deployment | Docker Compose, Nginx, Amazon EC2 |


## Infrastructure Architecture

<div align="center">

<img width="584" height="566" alt="TRIPFEED AWS 인프라 아키텍처" src="https://github.com/user-attachments/assets/9bfd1804-6f97-4ee0-94a1-7464f4cb35ea" />

</div>

프론트엔드는 Public Subnet의 EC2에서 Docker Compose로 운영합니다. Application Load Balancer의 요청을 Nginx가 수신해 Express 정적 서버로 전달하며, 브라우저의 API 요청은 `/server-api` 경로를 통해 백엔드로 전달됩니다. 런타임 API 주소는 EFS에 저장된 환경 설정의 `API_BASE_URL`로 주입합니다.

## Page Overview

<details>
<summary>전체 페이지 목록 보기</summary>

<br>

| Page | Path | Description |
| --- | --- | --- |
| Home / Feed | `/`, `/html/index.html` | 전체 및 카테고리별 게시글 목록 |
| Login | `/html/login.html` | 로그인과 이메일 형식 검증 |
| Signup | `/html/signup.html` | 회원가입과 입력값 검증 |
| Post Detail | `/html/board.html` | 게시글 상세, 댓글과 좋아요 |
| Post Write | `/html/board-write.html` | 카테고리 선택, 게시글과 이미지 등록 |
| Post Modify | `/html/board-modify.html` | 게시글과 첨부 이미지 수정 |
| Profile | `/html/modifyInfo.html` | 프로필 이미지와 닉네임 수정, 회원 탈퇴 |
| Password | `/html/modifyPassword.html` | 비밀번호 변경 |

</details>

## Project Structure

```text
.
├── api                 # 도메인별 백엔드 API 요청
├── component
│   ├── board           # 게시글 목록 아이템
│   ├── comment         # 댓글 UI
│   ├── dialog          # 공통 다이얼로그
│   └── header          # 헤더, 카테고리 탐색, 사용자 메뉴
├── css                 # 페이지별 스타일과 공통 레이아웃
├── html                # 서비스 페이지
├── js                  # 페이지별 상태, 이벤트와 렌더링 로직
├── nginx               # Nginx 이미지와 리버스 프록시 설정
├── public              # 이미지, 아이콘과 애니메이션 리소스
├── utils
│   ├── function.js     # URL, 인증 확인과 공통 유틸리티
│   ├── request.js      # 공통 Fetch 및 토큰 재발급
│   └── token.js        # 인메모리 액세스 토큰 관리
├── app.js              # Express 정적 서버와 런타임 설정 제공
├── compose.yml         # Frontend·Nginx 컨테이너 구성
└── Dockerfile          # Node.js 22 프론트 서버 이미지
```

## Deployment

```text
Application Load Balancer
          ↓ :80
Nginx Container
          ↓ proxy_pass frontend:3000
Express Frontend Container
          ↓
HTML · CSS · JavaScript

Amazon EFS
    ↓ /mnt/efs/config/frontend.env
API_BASE_URL → /config.js → Browser
```

Nginx와 Express 컨테이너는 동일한 Docker 브리지 네트워크에서 동작합니다. Express는 정적 파일과 캐시되지 않는 `/config.js`를 제공하고, Nginx는 외부 요청을 Express의 3000번 포트로 프록시합니다.

## Related Repository

- [TRIPFEED Backend](https://github.com/jungyungee/ktb_community_project)
