package com.tinyarcade.service.app;

import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 썸네일 파일 검사 (03_11_tinyarcade_thumbnail THM-F02·F03·N02).
 *
 * [참고] 왜 파일 "내용"으로 형식을 판정하나
 * - 파일 이름(x.png)이나 브라우저가 알려 주는 종류(image/png)는 보내는 쪽이 마음대로 바꿀 수 있다.
 *   텍스트 파일 이름만 .png로 바꿔도 화면 검사는 통과한다.
 * - 이미지 파일은 맨 앞 몇 바이트에 "나는 PNG다" 같은 고정된 표시(매직 넘버)가 있다. 이것을 직접 확인한다.
 *   - PNG : 89 50 4E 47 0D 0A 1A 0A
 *   - JPEG: FF D8 FF
 *   - WEBP: "RIFF" + 크기 4바이트 + "WEBP"
 * - svg는 받지 않는다. svg는 글자로 된 그림이라 안에 스크립트를 넣을 수 있다. gif도 요청에 없어서 받지 않는다.
 * - 저장·응답할 때도 브라우저가 보낸 종류가 아니라 여기서 판정한 종류를 쓴다.
 */
@Component
public class ThumbnailValidator {

    /** 500KB (허 요청 R2, 화면 검사 500 * 1024와 같음) */
    public static final long MAX_BYTES = 500 * 1024;

    /** 검사를 통과한 이미지: 판정한 형식 + 파일 내용 */
    public record ValidImage(String contentType, byte[] data) {
    }

    public ValidImage validate(MultipartFile file) {
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException(ErrorCode.THUMBNAIL_TOO_LARGE);
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INVALID_THUMBNAIL);
        }
        String contentType = detectType(data);
        if (contentType == null) {
            throw new BusinessException(ErrorCode.INVALID_THUMBNAIL);
        }
        return new ValidImage(contentType, data);
    }

    /** 맨 앞 바이트로 형식 판정. 모르는 형식이면 null */
    static String detectType(byte[] d) {
        if (startsWith(d, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (startsWith(d, 0, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        // R I F F ? ? ? ? W E B P
        if (startsWith(d, 0, 'R', 'I', 'F', 'F') && startsWith(d, 8, 'W', 'E', 'B', 'P')) {
            return "image/webp";
        }
        return null;
    }

    private static boolean startsWith(byte[] data, int offset, int... expected) {
        if (data.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[offset + i] & 0xFF) != expected[i]) {   // & 0xFF: 자바 byte는 -128~127이라 0~255로 바꿔 비교
                return false;
            }
        }
        return true;
    }
}
