package com.tinyarcade.service.vote;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.vote.MyVoteResponse;
import com.tinyarcade.dto.vote.VoteResponse;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.session.SessionStatus;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.vote.AppVote;
import com.tinyarcade.entity.vote.AppVoteId;
import com.tinyarcade.entity.vote.VoteType;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.app.AppRepository;
import com.tinyarcade.repository.session.PlaySessionRepository;
import com.tinyarcade.repository.user.UserRepository;
import com.tinyarcade.repository.vote.AppVoteRepository;
import com.tinyarcade.service.app.AppService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 추천·비추천 규칙 (메인 §5 "평가: 추천·비추천", 작업지시서 03_16).
 *
 * [참고] 이 클래스가 하는 일
 * - vote(): 버튼을 눌렀을 때 표를 저장·취소·전환하고, 앱의 추천 수·비추천 수를 함께 바꾼다.
 * - getMyVote(): 상세 화면이 열릴 때 "내가 누른 버튼"과 "플레이했는지"를 알려 준다.
 *
 * [참고] 토글 규칙 (유튜브식, 03_16 §2 표와 같음)
 * - 표가 없을 때 누르면      → 새로 저장 (그 종류 +1)
 * - 같은 버튼을 다시 누르면   → 취소 = 삭제 (그 종류 -1)
 * - 반대 버튼을 누르면       → 전환 (원래 종류 -1, 새 종류 +1)
 *
 * [참고] 왜 표와 숫자를 "같은 트랜잭션"에서 바꾸나
 * - 표는 app_votes 테이블, 숫자는 apps 테이블에 있다. 둘 중 하나만 바뀌면 화면 숫자와 실제 표가 어긋난다.
 * - `@Transactional`이 붙은 메서드는 안에서 한 일을 하나로 묶는다. 중간에 예외가 나면 전부 되돌린다(롤백).
 *   그래서 "표는 바뀌었는데 숫자는 그대로" 같은 반쪽 상태가 생기지 않는다.
 */
@Service                    // 스프링이 이 클래스를 "서비스 부품"으로 만들어 관리한다
@RequiredArgsConstructor    // Lombok: 아래 final 칸 5개를 받는 생성자를 자동으로 만든다 → 스프링이 그 생성자로 부품을 넣어 줌(의존성 주입)
public class VoteService {

    private final AppService appService;                   // 앱을 볼 수 있는지 확인 (15번 findVisibleApp 재사용)
    private final AppRepository appRepository;             // 추천 수 바꾸기·다시 읽기
    private final AppVoteRepository voteRepository;        // 표 찾기·저장·삭제
    private final PlaySessionRepository sessionRepository; // 플레이했는지 확인
    private final UserRepository userRepository;           // 표에 연결할 유저

    /**
     * 투표 (VOTE-F01~F06). 로그인한 사람만 들어온다(SecurityConfig의 "/api/** 로그인 필요" 규칙).
     *
     * @param loginUser 로그인한 사람 (JWT 필터가 넣어 줌. 여기서는 null이 아님)
     * @param appId     투표할 앱 번호 (주소의 {appId})
     * @param type      누른 버튼: RECOMMEND(추천) 또는 NOT_RECOMMEND(비추천)
     * @return 지금 내 표(취소면 null)와 바뀐 추천 수·비추천 수
     */
    @Transactional
    public VoteResponse vote(LoginUser loginUser, Long appId, VoteType type) {

        // ── 1. 볼 수 있는 앱인가 ──
        // 승인 앱은 누구나, 승인 대기·반려 앱은 본인·관리자만. 아니면 여기서 404 APP_NOT_FOUND 예외가 나고 메서드가 끝난다.
        // 앱 상세·리더보드와 같은 규칙을 쓰려고 새로 만들지 않고 AppService의 것을 그대로 부른다(03_16 결정 ①).
        // 돌려받는 App은 여기서 쓰지 않으므로 변수에 담지 않았다(확인만 하는 용도).
        appService.findVisibleApp(appId, loginUser);

        // ── 2. 이 앱을 플레이(점수 제출)했는가 ──
        // 메인 §5 "플레이 인정 기준": 점수 제출이 끝난 세션(SUBMITTED)이 하나라도 있어야 평가할 수 있다.
        // 게임을 시작만 하고 제출하지 않은 세션(OPEN)은 플레이로 치지 않는다.
        boolean played = sessionRepository.existsByAppIdAndUserIdAndStatus(
                appId, loginUser.id(), SessionStatus.SUBMITTED);
        if (!played) {
            // throw: 여기서 바로 멈추고 예외를 던진다. GlobalExceptionHandler가 받아서 403 + 안내 문구로 응답한다.
            throw new BusinessException(ErrorCode.PLAY_REQUIRED);
        }

        // ── 3. 내 기존 표 찾기 (잠그면서) ──
        // 기본 키가 (앱 번호, 유저 번호) 두 칸이라 AppVoteId에 담아서 찾는다.
        // Optional: 표가 있을 수도, 없을 수도 있어서 "상자"에 담겨 온다. isEmpty()(없나?), get()(꺼내기)로 쓴다.
        // findByIdForUpdate는 찾은 표 한 줄을 잠근다(SELECT ... FOR UPDATE).
        // → 같은 사람이 버튼을 거의 동시에 두 번 눌러도 두 번째 요청은 첫 번째가 끝날 때까지 기다렸다가
        //   바뀐 표를 보고 처리한다. 잠그지 않으면 둘 다 같은 "예전 표"를 보고 숫자를 두 번 바꿔 어긋난다(검증 중 실제로 발생).
        Optional<AppVote> existing = voteRepository.findByIdForUpdate(new AppVoteId(appId, loginUser.id()));

        // ── 4. 토글: 표를 저장·삭제·변경하고, 숫자를 얼마나 바꿀지(delta) 정한다 ──
        // delta = 바뀌는 양. +1(늘림), -1(줄임), 0(그대로). 실제로 더하는 건 5번에서 DB가 한다.
        int recommendDelta = 0;
        int notRecommendDelta = 0;
        VoteType myVote;   // 처리 후 "지금 내 표". 취소면 null이 된다

        try {
            if (existing.isEmpty()) {
                // [경우 1] 표가 없음 → 새로 저장
                // getReferenceById: DB를 읽지 않고 "이 번호의 앱/유저"라는 연결만 만든다.
                //   표를 저장할 때는 번호(외래 키)만 있으면 되므로 굳이 앱·유저 전체를 읽어 올 필요가 없다.
                App app = appRepository.getReferenceById(appId);
                User user = userRepository.getReferenceById(loginUser.id());
                // saveAndFlush: 저장하고 바로 DB에 보낸다(flush).
                //   바로 보내야 같은 키로 동시에 저장하려 할 때 생기는 충돌이 이 try 안에서 터져 아래 catch로 갈 수 있다.
                voteRepository.saveAndFlush(AppVote.of(app, user, type));
                myVote = type;
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = 1;          // 추천 +1
                } else {
                    notRecommendDelta = 1;       // 비추천 +1
                }

            } else if (existing.get().getVoteType() == type) {
                // [경우 2] 같은 버튼을 다시 누름 → 취소(표 삭제)
                // enum 비교는 == 로 한다(enum 값은 프로그램 안에 하나씩만 있어서 같은지 바로 비교 가능).
                voteRepository.delete(existing.get());
                voteRepository.flush();          // 삭제를 바로 DB에 보낸다
                myVote = null;                   // 취소했으니 내 표 없음
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = -1;         // 추천 -1
                } else {
                    notRecommendDelta = -1;      // 비추천 -1
                }

            } else {
                // [경우 3] 반대 버튼을 누름 → 전환(표 종류만 바꿈)
                // changeType으로 엔티티 값을 바꾸면, 트랜잭션 안이라 JPA가 바뀐 걸 알아채고 UPDATE를 보낸다(변경 감지).
                existing.get().changeType(type);
                voteRepository.flush();
                myVote = type;
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = 1;          // 비추천 → 추천: 추천 +1
                    notRecommendDelta = -1;      //                비추천 -1
                } else {
                    recommendDelta = -1;         // 추천 → 비추천: 추천 -1
                    notRecommendDelta = 1;       //                비추천 +1
                }
            }
        } catch (DataAccessException e) {
            // DataAccessException: DB 작업 중 난 오류를 스프링이 한 종류로 묶어 둔 것.
            // 여기서 날 수 있는 경우: 표가 없을 때 같은 사람이 동시에 두 번 눌러 둘 다 "새로 저장"하려 함
            //   → 같은 기본 키(앱 번호, 유저 번호)가 두 번 들어가려 해서 DB가 거부한다.
            // 그대로 두면 500(서버 오류)이 나므로, 409 + "잠시 후 다시 시도" 안내로 바꾼다(VOTE-N02).
            // 예외가 나가면 @Transactional이 이 메서드에서 한 일을 전부 되돌리므로 숫자도 바뀌지 않는다.
            throw new BusinessException(ErrorCode.VOTE_CONFLICT);
        }

        // ── 5. 숫자 바꾸기 → 바뀐 숫자를 다시 읽어 응답 ──
        // changeVoteCounts: "지금 값 + delta"를 DB가 직접 계산한다(UPDATE ... set recommend_count = recommend_count + ?).
        //   자바에서 읽어 와서 더한 뒤 저장하면, 다른 사람이 동시에 투표했을 때 한쪽 결과가 덮어써져 숫자가 빠질 수 있다.
        appRepository.changeVoteCounts(appId, recommendDelta, notRecommendDelta);
        // 바뀐 숫자를 다시 읽는다. changeVoteCounts의 clearAutomatically = true 덕분에
        // JPA가 기억해 둔 예전 앱 값을 지우고 DB에서 새로 읽어 온다(예전 숫자를 돌려주는 실수 방지).
        App updated = appRepository.findById(appId).orElseThrow();
        return new VoteResponse(myVote, updated.getRecommendCount(), updated.getNotRecommendCount());
    }

    /**
     * 내 투표 상태 (VOTE-F07, 03_16 결정 ②). 누구나 부를 수 있다(SecurityConfig에서 허용).
     * 상세 화면이 열릴 때 부르면, 처음부터 눌려 있어야 할 버튼과 "플레이 후 평가 가능" 안내 여부를 알 수 있다.
     *
     * @param loginUser 로그인하지 않았으면 null
     * @param appId     앱 번호
     * @return 내 표(없으면 null)와 플레이 여부. 비로그인이면 (null, false)
     */
    @Transactional(readOnly = true)   // 읽기만 한다는 표시 (쓰기용 준비를 생략해 조금 가볍다)
    public MyVoteResponse getMyVote(LoginUser loginUser, Long appId) {
        // 투표와 같은 규칙으로 앱 확인 (볼 수 없는 앱이면 404)
        appService.findVisibleApp(appId, loginUser);

        // 비로그인: 내 표도 플레이 기록도 없다고 답한다.
        // 오류(401) 대신 정상 응답을 주는 이유: 화면이 로그인 여부를 따로 나눠 처리하지 않아도 되게(팀원 영향 없음).
        if (loginUser == null) {
            return new MyVoteResponse(null, false);
        }

        // 내 표 찾기. 여기서는 읽기만 하므로 잠그지 않는 기본 findById를 쓴다.
        VoteType myVote = null;
        Optional<AppVote> existing = voteRepository.findById(new AppVoteId(appId, loginUser.id()));
        if (existing.isPresent()) {
            myVote = existing.get().getVoteType();
        }

        // 플레이 여부 (vote의 2번과 같은 조건)
        boolean played = sessionRepository.existsByAppIdAndUserIdAndStatus(
                appId, loginUser.id(), SessionStatus.SUBMITTED);
        return new MyVoteResponse(myVote, played);
    }
}
