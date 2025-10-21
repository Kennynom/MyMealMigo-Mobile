
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function ProfileScreen() {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user, userRole, loading: authLoading, logout } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    // For logout navigation
    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (e) {
            // Optionally show error
        }
    };

    useEffect(() => {
        if (!user) {
            setUserDoc(null);
            setProfileDoc(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', user.uid));
                setUserDoc(userSnap.exists() ? userSnap.data() : null);
                const profileSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'health_profile'));
                setProfileDoc(profileSnap.exists() ? profileSnap.data() : null);
            } catch (err) {
                setUserDoc(null);
                setProfileDoc(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const displayName = userDoc?.name || user?.displayName || 'Unknown';
    const displayEmail = userDoc?.email || user?.email || 'Unknown';
    const displayRole = userRole || userDoc?.role || 'guest';
    const profileImageUrl = userDoc?.photoURL || 'https://www.gravatar.com/avatar/?d=mp&s=200';

    if (authLoading || loading) {
        return (
            <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={theme.primaryGreen || '#58e221'} />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back-ios" style={styles.backIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerTitle}>
                    <Text style={styles.headerText}>Profile</Text>
                </View>
                <View style={styles.headerSide}>{/* Empty for spacing */}</View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* PFP Section */}
                <View>
                    <View style={{ alignItems: 'center', position: 'relative' }}>
                        <Image 
                            source={{ uri: profileImageUrl }} 
                            style={{ ...styles.profileImage, zIndex: 1 }} 
                        />
                        <TouchableOpacity
                            onPress={() => { /* Handle edit pfp */ }}
                            style={{
                                position: 'absolute',
                                bottom: -5,
                                right: 0,
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: theme.primaryGreen ?? '#58e221',
                                borderWidth: 2,
                                borderColor: theme.primaryGreen ?? '#58e221',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                            }}
                        >
                            <Feather 
                                name="edit-2"
                                size={24}
                                color={theme.altText}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info */}
                <View style={{
                    backgroundColor: theme.primaryDark,
                    alignItems: 'center',
                    paddingTop: 100,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    position: 'absolute',
                    top: 70,
                    marginHorizontal: 20,
                }}>
                    <View style={{ marginTop: -40 }}>
                        {/* Name */}
                        <Text style={styles.nameText}>{displayName}</Text>
                        {/* Email */}
                        <Text style={styles.emailText}>{displayEmail}</Text>
                        <View style={styles.roleContainer}>
                            <Text style={styles.roleText}>{displayRole}</Text>
                        </View>
                    </View>

                    {/* Buttons Section */}
                    <View style={{ marginTop: 10 }}>
                        {/* View Profile */}
                        <View style={styles.button}>
                            <TouchableOpacity onPress={() => { /* Handle view profile */ }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={styles.firstHalf}>
                                    <AntDesign name="user" size={24} color={theme.text} />
                                    <Text style={styles.buttonText}>View Profile</Text>
                                </View>
                                <View style={styles.secondHalf}>
                                    <AntDesign name="right" size={24} color={theme.text} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Edit Profile */}
                        <View style={styles.button}>
                            <TouchableOpacity onPress={() => { /* Handle edit profile */ }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={styles.firstHalf}>
                                    <AntDesign name="edit" size={24} color={theme.text} />
                                    <Text style={styles.buttonText}>Edit Profile</Text>
                                </View>
                                <View style={styles.secondHalf}>
                                    <AntDesign name="right" size={24} color={theme.text} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Upgrade to Pro */}
                        <View style={styles.button}>
                            <TouchableOpacity onPress={() => { /* Handle upgrade to pro */ }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={styles.firstHalf}>
                                    <MaterialIcons name="upgrade" size={24} color={theme.text} />
                                    <Text style={styles.buttonText}>Upgrade to Pro</Text>
                                </View>
                                <View style={styles.secondHalf}>
                                    <AntDesign name="right" size={24} color={theme.text} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Delete Account */}
                        <View style={styles.button}>
                            <TouchableOpacity onPress={() => { /* Handle delete account */ }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={styles.firstHalf}>
                                    <AntDesign name="delete" size={24} color={theme.text} />
                                    <Text style={styles.buttonText}>Delete Account</Text>
                                </View>
                                <View style={styles.secondHalf}>
                                    <AntDesign name="right" size={24} color={theme.text} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Logout */}
                        <View style={styles.logOutButton}>
                            <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={styles.firstHalf}>
                                    <AntDesign name="logout" size={24} color={theme.text} />
                                    <Text style={styles.buttonText}>Logout</Text>
                                </View>
                                <View style={styles.secondHalf}>
                                    <AntDesign name="right" size={24} color={theme.text} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    headerSide: {
        flex: 1,
        alignItems: 'flex-start',
    },
    headerTitle: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
    },
    backButton: {
        paddingLeft: 25,
    },
    backIcon: {
        fontSize: 22,
        color: theme.text,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: theme.primaryGreen ?? theme.primaryGreen ?? '#58e221',
      backgroundColor: theme.inactive,
      
    },
    editProfileImage: { 
        fontSize: 20,   
        color: theme.text,
        width: 50,
        height: 50,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: theme.secondary ?? theme.secondaryGreen ?? '#059669',
        backgroundColor: theme.secondary ?? theme.secondaryGreen ?? '#059669',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        backgroundColor: theme.background,
        alignItems: 'center',
    },
    nameText:{
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.altText,
        textAlign: 'center',
    },
    roleText:{
        fontSize: 16,
        color: theme.altText,
        textAlign: 'center',
    },
    emailText:{
        fontSize: 16,
        color: theme.altText,
        textAlign: 'center',
    },
    roleContainer:{
        marginTop: 15,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: theme.altBackground,
    },
    button:{
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        backgroundColor: theme.translucent ?? theme.translucent ?? '#FFFFFF83',
        shadowColor: '#000',
        shadowOffset: 0,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
        minWidth: 280,
        minHeight: 55,
        justifyContent: 'center',
    },
    logOutButton:{
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        backgroundColor: theme.error ?? theme.error ?? '#F44336',
        shadowColor: '#000',
        shadowOffset: 0,
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
        minWidth: 280,
        justifyContent: 'center',
    },
    buttonText:{
        marginLeft: 10,
        color: theme.text,
        fontSize: 16,
    },
    firstHalf:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    secondHalf:{
        flexDirection: 'row',
        alignItems: 'center',
    },
});