/**
 * 비밀번호 인증 관련 유틸리티
 */

import bcrypt from "bcrypt";
import { getDatabase } from "./db";

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const db = getDatabase();
  const settings = await db.queryOne<{ access_password: string }>(
    "SELECT access_password FROM app_settings WHERE id = 1"
  );

  if (!settings) {
    return false;
  }

  return await bcrypt.compare(password, settings.access_password);
}

/**
 * 비밀번호 변경
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // 현재 비밀번호 확인
  const isValid = await verifyPassword(currentPassword);
  if (!isValid) {
    return { success: false, message: "현재 비밀번호가 일치하지 않습니다." };
  }

  // 새 비밀번호 해시
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 비밀번호 업데이트
  const db = getDatabase();
  const result = await db.execute(
    "UPDATE app_settings SET access_password = $1 WHERE id = 1",
    [hashedPassword]
  );

  if (result.rowCount === 0) {
    return { success: false, message: "비밀번호 변경에 실패했습니다." };
  }

  return { success: true, message: "비밀번호가 변경되었습니다." };
}

/**
 * 비밀번호 초기화 (관리자용)
 */
export async function resetPassword(newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const db = getDatabase();
  await db.execute(
    "UPDATE app_settings SET access_password = $1 WHERE id = 1",
    [hashedPassword]
  );
}

