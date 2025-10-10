import { createContext, useContext, useEffect, useState } from "react";

import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    isLoadingUser: boolean;
    signUp: (email:string, password: string)=> Promise<string | null>;
    signIn: (email:string, password: string)=> Promise<string | null >;
    signOut: ()=> Promise<void>;
}

const AuthContext = createContext<AuthContextType| undefined>(undefined)

export function AuthProvider ({children}: {children : React.ReactNode}){
    const [user,setUser] = useState<Models.User<Models.Preferences> | null>(null);

    const[isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
    useEffect(()=>{
        getUser();

    },[])

    const getUser =async() =>{
        try{
            const session = await account.get()
            setUser(session)  
        }
        catch(error){
            setUser(null)
        }
        finally{
            setIsLoadingUser(false);
        }
    }


    const signUp = async (email:string, password: string)=>{
        try{
            await account.create(ID.unique(),email, password)
            await signIn(email, password)
        return null 
        
        }catch(error){
            if(error instanceof Error){
                return error.message
            }
            return "An error occyred during sign up.";
        }
    };

       const signIn = async (email:string, password: string)=>{
        try{
            await account.createEmailPasswordSession(email, password)
            const session = await account.get()
            setUser(session)
        return null 
        
        }catch(error){
            if(error instanceof Error){
                return error.message
            }
            return "An error occyred during sign up.";
        }
    };
    const signOut = async()=>{
        try{
            await account.deleteSession("current");
            setUser(null);
        }
        catch(error){
            console.log(error);
        }
    };
    return(
    <AuthContext.Provider 
         value={{ user, isLoadingUser, signUp, signIn, signOut}}
    >{children }</AuthContext.Provider>
    );

    
}
export function useAuth(){
    const context = useContext(AuthContext);
    if(context === undefined){
        throw new Error("useAuth must be inside of the AuthProvider");
        
    }
    return context;
}


// import { createContext, useContext, useEffect, useState } from "react";
// import { ID, Models } from "react-native-appwrite";
// import { account, DATABASE_ID, databases, USERS_COLLECTION_ID } from "./appwrite";

// type AuthContextType = {
//     user: Models.User<Models.Preferences> | null;
//     isLoading: boolean; // İşlem (sign-in/sign-up) yükleniyor durumu için
//     isSessionLoading: boolean; // Başlangıçtaki kullanıcı oturumu yüklenmesi için
//     signUp: (email: string, password: string, name: string) => Promise<string | null>; // name parametresi eklendi
//     signIn: (email: string, password: string) => Promise<string | null>;
//     signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//     const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
//     const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
//     const [isLoading, setIsLoading] = useState<boolean>(false); // Hata veren setLoading için state tanımı

//     useEffect(() => {
//         getUser();
//     }, []);

//     const getUser = async () => {
//         try {
//             const session = await account.get();
//             setUser(session);
//         } catch (error) {
//             setUser(null);
//         } finally {
//             setIsSessionLoading(false); // isLoadingUser -> isSessionLoading olarak değiştirildi
//         }
//     };

//     const signUp = async (email: string, password: string, name: string): Promise<string | null> => {
//         try {
//             setIsLoading(true); // setLoading -> setIsLoading

//             // Kullanıcı oluştur
//             const newAccount = await account.create(ID.unique(), email, password, name);
//             if (!newAccount) throw new Error("Account creation failed");

//             // Giriş yap
//             await account.createEmailPasswordSession(email, password);

//             // Kullanıcı bilgilerini al
//             const currentUser = await account.get();
//             setUser(currentUser);

//             // Kullanıcı profili oluştur
//             await databases.createDocument(
//                 DATABASE_ID,
//                 USERS_COLLECTION_ID,
//                 currentUser.$id,
//                 {
//                     name: name,
//                     age: 18,
//                     location: "Türkiye",
//                     bio: "Henüz bir bio eklenmedi.",
//                     interests: [],
//                     avatarUrl: "https://via.placeholder.com/200x200?text=Avatar",
//                     followers: 0,
//                     following: 0,
//                 }
//             );

//             return null; // Başarılı olursa null dön
//         } catch (error: any) {
//             console.error("Sign up error:", error);
//             return error.message || "An error occurred during sign up."; // Hata durumunda mesaj dön
//         } finally {
//             setIsLoading(false); // setLoading -> setIsLoading
//         }
//     };

//     const signIn = async (email: string, password: string): Promise<string | null> => {
//         try {
//             setIsLoading(true);
//             await account.createEmailPasswordSession(email, password);
//             const session = await account.get();
//             setUser(session);
//             return null;
//         } catch (error) {
//             if (error instanceof Error) {
//                 return error.message;
//             }
//             return "An error occurred during sign in.";
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const signOut = async () => {
//         try {
//             await account.deleteSession("current");
//             setUser(null);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     return (
//         <AuthContext.Provider
//             value={{ user, isLoading, isSessionLoading, signUp, signIn, signOut }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//     const context = useContext(AuthContext);
//     if (context === undefined) {
//         throw new Error("useAuth must be inside of the AuthProvider");
//     }
//     return context;
// }