# 🎓 SRMS - Scholastic Resource Management System

[![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Appwrite](https://img.shields.io/badge/Appwrite-23.0-F02E65?style=for-the-badge&logo=appwrite&logoColor=white)](https://appwrite.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**SRMS (Scholastic Resource Management System)** is a modern, cross-platform mobile application designed to streamline educational resource sharing, peer-to-peer mentoring, and academic focus tracking. Built with React Native and Expo, and powered by Appwrite’s robust cloud infrastructure, SRMS provides a seamless experience for students, tutors, and administrators alike.

---

## ✨ Key Features

### 🔐 Advanced Authentication
- **Multi-Role Support**: Tailored experiences for **Students**, **Peer Tutors**, and **Administrators**.
- **Secure Verification**: Robust email verification and secure password handling.
- **Onboarding**: Smooth registration flows tailored to each user type.

### 📊 Dynamic Dashboards
- **Role-Based Views**: Custom dashboards that display relevant stats, upcoming sessions, and notifications.
- **Real-time Updates**: Live synchronization using Appwrite’s cloud services.

### 📚 Resource Library
- **Module-based Content**: Easily browse and download study materials categorized by academic modules.
- **Tutor Uploads**: Peer tutors can upload and manage high-quality resources for students.

### 🤝 Mentoring (Kuppi Sessions)
- **Session Scheduling**: Seamless booking and management of peer-to-peer mentoring (Kuppi) sessions.
- **Interactive Polls**: Create and participate in polls for session timing and topic preferences.
- **Link Integration**: Direct access to Zoom/Class links from within the app.

### ⏱️ Productivity Tools
- **Focus Sessions**: Built-in specialized sessions to help students maintain deep focus on tasks.
- **Task Dashboard**: Integrated task management to keep track of academic deadlines.
- **Challenges**: Gamified timed quizzes and challenges to boost learning efficiency.

---

## 🛠 Tech Stack

- **Frontend**: [React Native](https://reactnative.dev/) via [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Backend-as-a-Service**: [Appwrite](https://appwrite.io/) (Database, Auth, Storage)
- **Styling**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), Linear Gradients, and Expo Blur.
- **Typography**: Inter, Roboto, and Libre Baskerville (via Google Fonts).

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- npm or yarn
- [Expo Go](https://expo.dev/go) app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saliyadilshan231-bit/SRMS.git
   cd SRMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Appwrite configuration (if applicable):
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   ```

### Running the App

Start the development server:
```bash
npx expo start
```

- Press **`a`** for Android emulator.
- Press **`i`** for iOS simulator.
- Scan the **QR code** with the Expo Go app to run on a physical device.

---

## 📁 Project Structure

| Directory | Description |
| :--- | :--- |
| `app/` | Main application routes and screens (Expo Router). |
| `components/` | Reusable UI components used across the app. |
| `services/` | API integration logic and Appwrite configuration. |
| `context/` | React Context for global state management (Auth, Theme). |
| `hooks/` | Custom React hooks for specialized logic. |
| `constants/` | Color palettes, layout sizing, and static config. |
| `assets/` | Local images, icons, and font files. |

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## ✉️ Contact

Project Link: [https://github.com/saliyadilshan231-bit/SRMS](https://github.com/saliyadilshan231-bit/SRMS)

Developed with ❤️ by the SRMS Team.
