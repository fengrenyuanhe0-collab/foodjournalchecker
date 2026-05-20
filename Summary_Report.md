# Food Journal Tracker App - Run Report
# 饮食日记追踪应用 - 运行报告

## Executive Summary
## 摘要
This report documents the troubleshooting process for the Food Journal Tracker mobile application built with React Native and Expo. The core issues encountered included Expo SDK version incompatibility (SDK 55 vs 52), database initialization errors due to expo-sqlite API changes, component import/naming issues, database query result access errors, and UI/UX problems with scrollable components and camera integration. All critical issues were resolved through targeted code modifications, API updates, and layout adjustments, enabling full functionality including user authentication, food journal management, and camera/photo integration.
本报告记录了基于 React Native 和 Expo 构建的饮食日记追踪移动应用的故障排除过程。遇到的核心问题包括 Expo SDK 版本不兼容（SDK 55 与 52 冲突）、因 expo-sqlite API 变更导致的数据库初始化错误、组件导入/命名问题、数据库查询结果访问错误，以及可滚动组件和相机集成相关的 UI/UX 问题。通过针对性的代码修改、API 更新和布局调整，所有关键问题均已解决，应用实现了用户认证、饮食日记管理、相机/照片集成等完整功能。

## Run Attempts and Issues
## 运行尝试与问题

### Issue 1: SDK Version Incompatibility
### 问题 1：SDK 版本不兼容
- **Error**: The project uses Expo SDK 52, but my local development environment and Expo Go app were using SDK 55. The versions did not match, so the app could not start.
- **错误**：项目使用的是 Expo SDK 52，但我的本地开发环境和 Expo Go 应用是 SDK 55，版本不匹配导致应用无法启动。
- **Solution**: I installed the compatible Expo Go version for SDK 52 to match the project’s SDK version, allowing the app to run normally.
- **解决方案**：我安装了适配 SDK 52 的 Expo Go 版本，与项目版本保持一致，使应用能够正常运行。

### Issue 2: Database Initialization Error
### 问题 2：数据库初始化错误
- **Error**: `[TypeError: Cannot read property 'execAsync' of undefined]` occurred during database initialization, as the expo-sqlite API had changed in newer versions.
- **错误**：数据库初始化过程中出现 `[TypeError: Cannot read property 'execAsync' of undefined]` 错误，原因是新版 expo-sqlite 的 API 发生变更。
- **Solution**: Updated database code to use the new expo-sqlite API, replacing deprecated methods like `withTransactionAsync` and adjusting query execution (using `getAllAsync` for SELECT, `runAsync` for INSERT/UPDATE/DELETE).
- **解决方案**：更新数据库代码以适配新版 expo-sqlite API，替换 `withTransactionAsync` 等废弃方法，并调整查询执行逻辑（SELECT 查询使用 `getAllAsync`，INSERT/UPDATE/DELETE 使用 `runAsync`）。

### Issue 3: React Component Import Error
### 问题 3：React 组件导入错误
- **Error**: `Warning: ReferenceError: Property 'Button' doesn't exist` in HomeScreen.js, as the Button component was used but not imported from react-native.
- **错误**：HomeScreen.js 中出现 `Warning: ReferenceError: Property 'Button' doesn't exist` 警告，原因是使用了 Button 组件但未从 react-native 中导入。
- **Solution**: Added Button to the import statement in HomeScreen.js to resolve the undefined component error.
- **解决方案**：在 HomeScreen.js 的导入语句中添加 Button 组件，解决组件未定义错误。

### Issue 4: Database Unique Constraint Error
### 问题 4：数据库唯一性约束错误
- **Error**: `Error code : UNIQUE constraint failed: users.email` when attempting to register a duplicate email address, triggering the database's unique constraint on the email field.
- **错误**：尝试注册重复邮箱地址时出现 `Error code : UNIQUE constraint failed: users.email` 错误，触发了数据库对 email 字段的唯一性约束。
- **Solution**: Enhanced error handling in authScreen.js to detect unique constraint errors and display user-friendly messages (e.g., "This email address is already registered").
- **解决方案**：增强 authScreen.js 中的错误处理逻辑，识别唯一性约束错误并显示友好提示（如“该邮箱地址已被注册”）。

### Issue 5: Login Validation Logic Flaw
### 问题 5：登录验证逻辑缺陷
- **Error**: The app failed to distinguish between "email not registered" and "incorrect password", always showing "invalid email or password".
- **错误**：应用无法区分“邮箱未注册”和“密码错误”，始终显示“无效的邮箱或密码”。
- **Solution**: Modified login logic to validate email existence first, then check password validity, providing specific error messages for each scenario.
- **解决方案**：修改登录逻辑，先验证邮箱是否存在，再检查密码是否正确，为不同场景提供具体的错误提示。

### Issue 6: Database Query Result Access Error
### 问题 6：数据库查询结果访问错误
- **Error**: `TypeError: Cannot read property 'password' of undefined` due to changes in expo-sqlite's query result structure (rows.item(0) → rows._array).
- **错误**：因 expo-sqlite 查询结果结构变更（rows.item(0) → rows._array），出现 `TypeError: Cannot read property 'password' of undefined` 错误。
- **Solution**: Updated code to access query results via `rows._array[0]` instead of `rows.item(0)` and added validation for result structure.
- **解决方案**：更新代码，通过 `rows._array[0]` 替代 `rows.item(0)` 访问查询结果，并添加结果结构验证逻辑。

### Issue 7: User ID Retrieval After Registration
### 问题 7：注册后用户 ID 获取失败
- **Error**: Failed to retrieve the newly registered user's ID due to changes in expo-sqlite's insert result structure (insertId → lastInsertRowId).
- **错误**：因 expo-sqlite 插入结果结构变更（insertId → lastInsertRowId），无法获取新注册用户的 ID。
- **Solution**: Added compatibility for both `insertId` and `lastInsertRowId` in the registration logic, with error handling for ID retrieval failures.
- **解决方案**：在注册逻辑中添加对 `insertId` 和 `lastInsertRowId` 的兼容处理，并为 ID 获取失败添加错误处理。

### Issue 8: Camera Component Naming Error
### 问题 8：相机组件命名错误
- **Error**: `Warning: React.jsx: type is invalid` for the Camera component, as expo-camera renamed `Camera` to `CameraView` in newer versions.
- **错误**：Camera 组件出现 `Warning: React.jsx: type is invalid` 警告，原因是新版 expo-camera 将 `Camera` 重命名为 `CameraView`。
- **Solution**: Updated all references from `Camera` to `CameraView` (imports, component usage, permission requests).
- **解决方案**：将所有 `Camera` 相关引用更新为 `CameraView`（导入、组件使用、权限请求）。

### Issue 9: Package Version Compatibility
### 问题 9：包版本兼容性问题
- **Error**: Warnings about incompatible package versions (e.g., @react-native-picker/picker@2.11.0 vs expected 2.9.0) with Expo SDK 52.
- **错误**：出现包版本不兼容警告（如 @react-native-picker/picker@2.11.0 与预期的 2.9.0 不匹配），与 Expo SDK 52 冲突。
- **Solution**: Installed SDK 52-compatible versions of problematic packages via `npm install @react-native-picker/picker@2.9.0 react-native-safe-area-context@4.12.0 react-native-screens@~4.4.0`.
- **解决方案**：通过 `npm install @react-native-picker/picker@2.9.0 react-native-safe-area-context@4.12.0 react-native-screens@~4.4.0` 安装与 SDK 52 兼容的包版本。

### Issue 10: Home Screen Loading Stuck
### 问题 10：首页加载卡住
- **Error**: Home screen remained in loading state ("Loading your food journals") due to unhandled errors in the `loadJournals` function, leaving `isLoading` set to true.
- **错误**：因 `loadJournals` 函数中的未处理错误，首页始终处于加载状态（“正在加载你的饮食日记”），`isLoading` 未重置为 false。
- **Solution**: Implemented try-catch-finally in the initialize function to ensure `isLoading` is set to false regardless of errors, and enhanced error logging in `loadJournals`.
- **解决方案**：在 initialize 函数中添加 try-catch-finally 逻辑，确保无论是否出错，`isLoading` 都会设为 false，并增强 `loadJournals` 的错误日志。

### Issue 11: Camera Permission Request Failure
### 问题 11：相机权限请求失败
- **Error**: `CameraView.requestCameraPermissionsAsync is not a function` as expo-camera replaced permission methods with the `useCameraPermissions` hook.
- **错误**：出现 `CameraView.requestCameraPermissionsAsync is not a function` 错误，原因是 expo-camera 改用 `useCameraPermissions` 钩子处理权限请求。
- **Solution**: Replaced direct permission calls with the `useCameraPermissions` hook to request and check camera permissions.
- **解决方案**：使用 `useCameraPermissions` 钩子替代直接的权限调用，实现相机权限的请求与检查。

### Issue 12: ImagePicker API Deprecation Warning
### 问题 12：ImagePicker API 弃用警告
- **Error**: `[expo-image-picker] MediaTypeOptions have been deprecated` as the API switched to `MediaType` or string arrays.
- **错误**：出现 `[expo-image-picker] MediaTypeOptions have been deprecated` 警告，原因是 API 改用 `MediaType` 或字符串数组。
- **Solution**: Updated ImagePicker calls to use `mediaTypes: ['images']` instead of `MediaTypeOptions.Images`.
- **解决方案**：更新 ImagePicker 调用逻辑，使用 `mediaTypes: ['images']` 替代 `MediaTypeOptions.Images`。

### Issue 13: Home Screen Scroll Functionality
### 问题 13：首页滚动功能异常
- **Error**: "Your Food Journals" section was not scrollable, hiding content beyond the screen due to missing ScrollView wrapping.
- **错误**：“你的饮食日记”模块无法滚动，因缺少 ScrollView 包裹，超出屏幕的内容被隐藏。
- **Solution**: Wrapped the entire home screen content in a ScrollView and adjusted styles to enable full content scrolling.
- **解决方案**：将首页所有内容包裹在 ScrollView 中，并调整样式以实现完整内容滚动。

### Issue 14: VirtualizedList Nesting Error
### 问题 14：VirtualizedList 嵌套错误
- **Error**: `VirtualizedLists should never be nested inside plain ScrollViews` (SwipeListView inside ScrollView).
- **错误**：出现 `VirtualizedLists should never be nested inside plain ScrollViews` 错误（SwipeListView 嵌套在 ScrollView 中）。
- **Solution**: Redesigned the layout to separate input and list sections, using fixed-height containers for SwipeListView to avoid nested scroll views.
- **解决方案**：重新设计布局，分离输入区和列表区，为 SwipeListView 设置固定高度容器，避免嵌套滚动视图。

### Issue 15: SwipeListView Action Buttons Hidden
### 问题 15：SwipeListView 操作按钮被隐藏
- **Error**: Edit/delete buttons (yellow/red) in SwipeListView were covered by journal entries, making them inaccessible to users.
- **错误**：SwipeListView 中的编辑/删除按钮（黄色/红色）被日记条目覆盖，用户无法访问。
- **Solution**: Adjusted SwipeListView configuration and styles (e.g., button width, z-index) to ensure action buttons display correctly when swiped.
- **解决方案**：调整 SwipeListView 配置和样式（如按钮宽度、z-index），确保滑动时操作按钮正确显示。