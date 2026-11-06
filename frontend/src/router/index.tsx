import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { MainLayout } from '../layouts/MainLayout'
import { AdminAppsPage } from '../pages/admin/AdminAppsPage'
import { AdminClosePage } from '../pages/admin/AdminClosePage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminVerifyPage } from '../pages/admin/AdminVerifyPage'
import { AppRegisterPage } from '../pages/app-register/AppRegisterPage'
import { AppDetailPage } from '../pages/apps/AppDetailPage'
import { AppListPage } from '../pages/apps/AppListPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SignupPage } from '../pages/auth/SignupPage'
import { BoardListPage } from '../pages/board/BoardListPage'
import { PostDetailPage } from '../pages/board/PostDetailPage'
import { PostEditPage } from '../pages/board/PostEditPage'
import { GuidePage } from '../pages/guide/GuidePage'
import { HomePage } from '../pages/home/HomePage'
import { MyPage } from '../pages/mypage/MyPage'
import { RankingPage } from '../pages/ranking/RankingPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps" element={<AppListPage />} />
        <Route path="/apps/register" element={<AppRegisterPage />} />
        <Route path="/apps/:appId" element={<AppDetailPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/board" element={<BoardListPage />} />
        <Route path="/board/write" element={<PostEditPage />} />
        <Route path="/board/:postId" element={<PostDetailPage />} />
        <Route path="/board/:postId/edit" element={<PostEditPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/apps" replace />} />
          <Route path="apps" element={<AdminAppsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="verify" element={<AdminVerifyPage />} />
          <Route path="close" element={<AdminClosePage />} />
        </Route>
      </Route>
    </Routes>
  )
}
