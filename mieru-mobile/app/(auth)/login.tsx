import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../constants/config";

const HOSPITAL_CODE_KEY = "mieru_saved_hospital_code";

export default function LoginScreen() {
  const { login } = useAuth();

  const [hospitalCode, setHospitalCode] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberCode, setRememberCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 保存された病院コードの復元
  useState(() => {
    SecureStore.getItemAsync(HOSPITAL_CODE_KEY).then((saved) => {
      if (saved) setHospitalCode(saved);
    });
  });

  const isEmail = loginId.includes("@");

  const handleLogin = async () => {
    setError(null);

    if (!loginId.trim()) {
      setError("スタッフIDまたはメールアドレスを入力してください");
      return;
    }
    if (!password) {
      setError("パスワードを入力してください");
      return;
    }
    if (!isEmail && !hospitalCode.trim()) {
      setError("病院コードを入力してください");
      return;
    }

    setIsSubmitting(true);

    const result = await login({
      hospitalCode: hospitalCode.trim(),
      loginId: loginId.trim(),
      password,
    });

    if (result.success) {
      if (rememberCode && hospitalCode.trim()) {
        await SecureStore.setItemAsync(HOSPITAL_CODE_KEY, hospitalCode.trim());
      }
    } else {
      setError(result.error ?? "ログインに失敗しました");
    }

    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ロゴ */}
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>MIERU</Text>
            <Text style={styles.logoSub}>タイムスタディ</Text>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            {/* 病院コード */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>病院コード</Text>
              <TextInput
                style={[styles.input, isEmail && styles.inputDisabled]}
                value={hospitalCode}
                onChangeText={setHospitalCode}
                placeholder="8桁の病院コード"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={8}
                editable={!isEmail}
              />
              {isEmail && (
                <Text style={styles.hint}>
                  メールアドレスの場合、病院コードは不要です
                </Text>
              )}
            </View>

            {/* スタッフID / メール */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                スタッフID / メールアドレス
              </Text>
              <TextInput
                style={styles.input}
                value={loginId}
                onChangeText={setLoginId}
                placeholder="スタッフID またはメールアドレス"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
              />
            </View>

            {/* パスワード */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="パスワード"
                placeholderTextColor={COLORS.gray}
                secureTextEntry
                textContentType="password"
              />
            </View>

            {/* エラー */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ログインボタン */}
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            {/* 病院コード記憶 */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberCode(!rememberCode)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberCode && styles.checkboxChecked,
                ]}
              >
                {rememberCode && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>
                病院コードを記憶する
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoText: {
    fontSize: 44,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 4,
  },
  logoSub: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginTop: 4,
    letterSpacing: 2,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  inputDisabled: {
    backgroundColor: COLORS.grayLight,
    color: COLORS.gray,
  },
  hint: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  rememberText: {
    fontSize: 13,
    color: COLORS.grayDark,
  },
});
