import { useAuth } from "@/lib/auth-context";
import { theme } from '@/lib/theme';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setError(null);

    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
    }
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title} variant="headlineLarge">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitle} variant="bodyMedium">
              {isSignUp 
                ? "Sign up to get started with EventFlow" 
                : "Sign in to continue to EventFlow"}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color="#9ca3af" 
                  style={styles.inputIcon} 
                />
                <TextInput 
                  autoCapitalize="none" 
                  keyboardType="email-address"
                  placeholder="example@gmail.com"
                  placeholderTextColor="#A1A1AA"
                  mode="flat"
                  value={email}
                  style={styles.input}
                  onChangeText={setEmail}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={styles.inputContent}
                  textColor="#f9fafb"
                  theme={{
                    colors: {
                      background: '#1f2937',
                    }
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#9ca3af" 
                  style={styles.inputIcon} 
                />
                <TextInput 
                  autoCapitalize="none" 
                  secureTextEntry={secureTextEntry}
                  placeholder="Enter your password"
                  placeholderTextColor="#A1A1AA"
                  mode="flat"
                  value={password}
                  style={styles.input}
                  onChangeText={setPassword}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={styles.inputContent}
                  textColor="#A1A1AA"
                  theme={{
                    colors: {
                      background: '#1f2937',
                    }
                  }}
                  right={
                    <TextInput.Icon 
                      icon={secureTextEntry ? "eye-off" : "eye"} 
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                      color="#9ca3af"
                    />
                  }
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Forgot Password */}
            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Auth Button */}
            <TouchableOpacity 
              style={styles.authButton}
              onPress={handleAuth}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Switch Mode */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.switchLink}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: { 
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 20,
    zIndex: 1,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    height: 56,
  },
  inputContent: {
    paddingLeft: 44,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}20`, // 12% opacity
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 12,
    marginBottom: 0,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  switchLink: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});