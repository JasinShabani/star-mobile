import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCategories } from '../../api/category';
import api from '../../api/client';
import { COUNTRIES, CITIES } from '../../constants/geo';
import UserProfileScreen from '../Profile/UserProfileScreen';
import { PanGestureHandler } from 'react-native-gesture-handler';
import PostDetail from '../Profile/PostDetail';
import { getMe } from '../../api/user';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { createThumbnail } from 'react-native-create-thumbnail';

const { width } = Dimensions.get('window');

const LEVELS = [
  { label: 'Global', value: 'global' },
  { label: 'Country', value: 'country' },
  { label: 'City', value: 'city' },
];

const TABS = [
  { label: 'General', value: 'general' },
  { label: 'Me', value: 'me' },
];

function getPlaceText(rank: number) {
  if (rank === 1) return '1st place';
  if (rank === 2) return '2nd place';
  if (rank === 3) return '3rd place';
  return `${rank}th place`;
}

const crownColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

function getFlag(countryName: string | undefined): string | null {
  if (!countryName) return null;
  const entry = COUNTRIES.find((c) => c.value === countryName);
  if (!entry) return null;
  const flag = entry.label.split(' ')[0];
  return flag;
}

function TopUser({ user, rank }: { user: any; rank: number }) {
  const crownColorsMap = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const sizeMap = { 1: 100, 2: 80, 3: 70 };
  const offsetMap = { 1: 0, 2: 20, 3: 20 };

  const avatarSize = sizeMap[rank] || 70;
  const verticalOffset = offsetMap[rank] || 0;

  return (
    <View style={[styles.topUserContainer, { width: avatarSize + 20, marginTop: verticalOffset }]}>
      <Icon name="crown" size={36} color={crownColorsMap[rank - 1]} style={styles.crownIcon} />
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: user.user.profileImage }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderWidth: 3, borderColor: '#fff', marginBottom: 6 }} />
        {/* Country flag overlay */}
        {(() => {
          const flag = getFlag(user.user.country);
          return flag ? (
            <Text style={{ position: 'absolute', right: -15, top: -6, fontSize: 29 }}>{flag}</Text>
          ) : null;
        })()}
      </View>
      <Text style={styles.topUserName}>{user.user.username}</Text>
      <Text style={styles.starCount}>🌟 {user.post.starCount}</Text>
      <Text style={styles.topUserScore}>{user.rank}</Text>
    </View>
  );
}

// Helper component for displaying a group badge for tied top ranks
function TopRankGroup({ rank, count }: { rank: number; count: number }) {
  const badgeColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze
  const sizeMap = { 1: 100, 2: 80, 3: 70 };
  const verticalOffset = { 1: 0, 2: 20, 3: 20 };

  const avatarSize = sizeMap[rank] || 70;
  const offset = verticalOffset[rank] || 0;

  return (
    <View style={[styles.topUserContainer, { width: avatarSize + 20, marginTop: offset }]}>
      <Icon name="crown" size={36} color={badgeColors[rank - 1]} style={styles.crownIcon} />
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: 3,
          borderColor: '#fff',
          marginBottom: 6,
          backgroundColor: '#181828',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={styles.groupBadgeText}>{count}</Text>
      </View>
      <Text style={styles.topUserName}>{getPlaceText(rank)}</Text>
      <Text style={styles.starCount}>multiple</Text>
      <Text style={styles.topUserScore}>{rank}</Text>
    </View>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'general' | 'me'>('general');
  const [level, setLevel] = useState<'global' | 'country' | 'city'>('global');
  const [country, setCountry] = useState<string>(COUNTRIES[0].value);
  const [city, setCity] = useState<string>(CITIES[COUNTRIES[0].value][0]);
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [openLevel, setOpenLevel] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<{ id: string; username: string; profileImage?: string } | null>(null);
  const [selectedRankPosts, setSelectedRankPosts] = useState<{ rank: number; posts: any[] } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const viewShotRef = useRef<any>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Group posts by rank (1‑10) for "Me" summary
  const rankGroups = React.useMemo(() => {
    const groups: Record<number, any[]> = {};
    data.forEach((entry) => {
      if (entry.rank && entry.rank <= 10) {
        if (!groups[entry.rank]) groups[entry.rank] = [];
        groups[entry.rank].push(entry);
      }
    });
    return groups;
  }, [data]);

  // Group top‑3 ranks for General tab (ties handled)
  const topRankGroups = React.useMemo(() => {
    const groups: Record<number, any[]> = {};
    data.forEach((entry) => {
      if (entry.rank && entry.rank <= 3) {
        if (!groups[entry.rank]) groups[entry.rank] = [];
        groups[entry.rank].push(entry);
      }
    });
    return groups;
  }, [data]);

  // Fetch categories on mount
  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        setCategories([{ label: 'All Categories', value: null }, ...cats.map((c: any) => ({ label: `${c.icon} ${c.name}`, value: c.id }))]);
      } catch {
        setCategories([{ label: 'All Categories', value: null }]);
      }
    })();
  }, []);

  // Update city when country changes
  useEffect(() => {
    setCity(CITIES[country][0]);
  }, [country]);

  // Fetch leaderboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = tab === 'general' ? '/leaderboard/general' : '/leaderboard/me';
      let params: any = { level };
      if (level === 'country') params.country = country;
      if (level === 'city') {
        params.country = country;
        params.city = city;
      }
      if (category) params.categoryId = category;
      const res = await api.get(url, { params });
      // Transform the API response to normalize starCount and remove _count
      const transformed = res.data.map((entry: any) => ({
        ...entry,
        post: {
          id: entry.post.id,
          caption: entry.post.caption,
          media: entry.post.media,
          starCount: entry.post.starCount ?? 0,
        },
      }));
      console.log('Leaderboard /me response:', res.data);
      setData(transformed);
    } catch (e: any) {
      setError('Failed to load leaderboard');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, level, country, city, category]);

  useEffect(() => {
    fetchData();
  }, [tab, level, country, city, category, fetchData]);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setCurrentUser(me);
      } catch {}
    })();
  }, []);

  // Dropdown items
  const levelItems = LEVELS;
  const countryItems = COUNTRIES;
  const cityItems = CITIES[country].map(c => ({ label: c, value: c }));
  const categoryItems = categories;

  // Function to capture and share
  const handleShare = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        await Share.open({ url: uri, type: 'image/png', failOnCancel: false });
        setShowShare(false);
      }
    } catch {}
  };

  // Derive bool shareAvailable
  const myEntry = data.find((e:any)=> currentUser && e.user.id===currentUser.id);
  const shareAvailable = myEntry && myEntry.rank && myEntry.rank<=3;

  // Get top3Entries (unique ranks 1,2,3) include myEntry and maybe others
  const topThree = data.filter((e:any)=> e.rank<=3).slice(0,3);

  const openShareModal = async () => {
    if (!myEntry) return;
    const firstMedia = myEntry.post.media.find((m: any) => m.order === 0) || myEntry.post.media[0];
    let uri = firstMedia.url;
    if (firstMedia.type === 'video') {
      try {
        const { path } = await createThumbnail({ url: firstMedia.url });
        uri = path;
      } catch {}
    }
    setPreviewUri(uri);
    setShowShare(true);
  };

  if (selectedPostUser) {
    return (
      <PanGestureHandler onGestureEvent={() => setSelectedPostUser(null)}>
        <View style={{ flex: 1, backgroundColor: '#101018' }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 35 }} onPress={() => setSelectedPostUser(null)}>
            <Icon name="arrow-left" size={26} color="#00f2ff" />
            <Text style={{ color: '#00f2ff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Back to Leaderboard</Text>
          </TouchableOpacity>
          <UserProfileScreen username={selectedPostUser.username} />
        </View>
      </PanGestureHandler>
    );
  }

  if (selectedPost) {
    console.log('Selected Post User:', selectedPost.user);
    return (
      <PanGestureHandler onGestureEvent={() => setSelectedPost(null)}>
        <View style={{ flex: 1, backgroundColor: '#101018' }}>
          <PostDetail
            route={{
              params: {
                postId: selectedPost.id,
                user: selectedPost.user,
                rank: selectedPost.rank,
                level: selectedPost.level,
                country: selectedPost.country,
                city: selectedPost.city,
              },
            }}
            navigation={{
              goBack: () => setSelectedPost(null),
              navigate: (_: string, params: any) => setSelectedPostUser(params?.user || selectedPost.user),
            }}
          />
        </View>
      </PanGestureHandler>
    );
  }

  // Collect postIds that are already displayed in the Top‑3 section
  const topPostIds = new Set<string>();
  [1, 2, 3].forEach((r) => {
    const grp = topRankGroups[r];
    if (grp) {
      grp.forEach((e: any) => topPostIds.add(e.post.id));
    }
  });

  // Rest = entries ranked >3 whose *postId* is not in Top‑3
  const rest = data.filter(
    (entry) => entry.rank > 3 && !topPostIds.has(entry.post.id)
  );

  // ShareModal JSX
  const ShareModal = (
    <Modal visible={showShare} animationType="slide" onRequestClose={()=>setShowShare(false)}>
      <View style={{flex:1, backgroundColor:'#101018'}}>
        <ViewShot ref={viewShotRef} options={{format:'png', quality:0.96}} style={{position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#101018', justifyContent:'center', alignItems:'center'}}>
          <View style={{backgroundColor:'#181828', padding:20, borderRadius:16, width:width*0.9}}>
            <Image source={{ uri: 'https://yasinsaban.com/star/star-logo-transparent.png' }} style={{ width: 100, height: 80, alignSelf: 'center', marginBottom: 3 }} />
            <Text style={{color:'#00f2ff', fontSize:24, fontWeight:'bold', textAlign:'center', marginBottom:20}}>🏆 Leaderboard</Text>
            <View style={{flexDirection:'row', justifyContent:'space-around', marginBottom:18}}>
              {topThree.map((entry:any,index:number)=> (
                <View key={entry.id} style={{alignItems:'center'}}>
                  {/* Avatar with flag overlay */}
                  <View style={{ position: 'relative' }}>
                    <Image source={{uri:entry.user.profileImage}} style={{width:70,height:70,borderRadius:35,borderWidth:3,borderColor:'#00f2ff'}} />
                    {(() => {
                      const flag = getFlag(entry.user.country);
                      return flag ? (
                        <Text style={{ position: 'absolute', right: -10, top: -6, fontSize: 22 }}>{flag}</Text>
                      ) : null;
                    })()}
                  </View>
                  <Text style={{color:'#fff',marginTop:6}} numberOfLines={1}>@{entry.user.username}</Text>
                  <Text style={{fontSize:20}}>{entry.rank===1?'🥇':entry.rank===2?'🥈':entry.rank===3?'🥉':'🏅'}</Text>
                </View>
              ))}
            </View>
            {myEntry && (
              <>
                <View style={{width:'100%',height:300,borderRadius:12,overflow:'hidden',position:'relative'}}>
                  {previewUri ? (
                    <Image source={{uri: previewUri}} style={{width:'100%',height:'100%'}} />
                  ) : (
                    <ActivityIndicator color="#00f2ff" style={{height:'100%',alignSelf:'center'}} />
                  )}
                  {currentUser && (
                    <View style={{position:'absolute', top:8, left:8, flexDirection:'row', alignItems:'center', backgroundColor:'#000a', paddingHorizontal:6, paddingVertical:3, borderRadius:20}}>
                      <Image source={{uri: currentUser.profileImage}} style={{width:26,height:26,borderRadius:13,borderWidth:1,borderColor:'#00f2ff'}} />
                      <Text style={{color:'#fff', fontSize:13, marginLeft:6}}>@{currentUser.username}</Text>
                    </View>
                  )}
                </View>
                <Text style={{color:'#fff',textAlign:'center',marginTop:10,fontSize:18}}>
                  I am ranked {myEntry.rank}{myEntry.rank===1?'st':myEntry.rank===2?'nd':myEntry.rank===3?'rd':'th'} in {level==='global'?'Global':level==='country'?(COUNTRIES.find(c=>c.value===country)?.label ?? country):city}{category ? `\n • ${myEntry.category?.icon ?? ''} ${myEntry.category?.name}` : ''}!
                </Text>
              </>
            )}
          </View>
        </ViewShot>
        {/* Bottom action buttons */}
        <View style={{position:'absolute', bottom:40, left:0, right:0, flexDirection:'row', justifyContent:'center'}}>
          <TouchableOpacity onPress={()=>setShowShare(false)} style={{borderWidth:2, borderColor:'#00f2ff', paddingVertical:12, paddingHorizontal:28, borderRadius:24, marginHorizontal: 10}}>
            <Text style={{color:'#fff',fontSize:15}}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{backgroundColor:'#00f2ff', paddingVertical:12, paddingHorizontal:28, borderRadius:24, marginHorizontal: 10, flexDirection:'row', alignItems:'center'}} onPress={handleShare}>
            <Icon name="share-variant" size={19} color="#101018" style={{marginRight: 10}} />
            <Text style={{color:'#101018', fontWeight:'bold', fontSize:15}}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tabBtn, tab === t.value && styles.tabBtnActive]}
            onPress={() => setTab(t.value as 'general' | 'me')}
          >
            <Text style={[styles.tabLabel, tab === t.value && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Filters (hidden on "Me" tab) */}
      {tab !== 'me' && (
        <>
          <View style={styles.filtersRow}>
            {/* Level & Category dropdowns */}
            <View style={{ flex: 1, zIndex: 2000 }}>
              <DropDownPicker
                open={openLevel}
                value={level}
                items={levelItems}
                setOpen={(val) => {
                  setOpenLevel(val);
                  if (val) {
                    setOpenCategory(false);
                    setOpenCountry(false);
                    setOpenCity(false);
                  }
                }}
                setValue={setLevel}
                setItems={() => {}}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: '#fff', fontSize: 15 }}
                arrowIconStyle={{ tintColor: '#fff' }}
                tickIconStyle={{ tintColor: '#fff' }}
                listMode="SCROLLVIEW"
                disabled={loading}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8, zIndex: openCategory ? 2900 : 1000 }}>
              <DropDownPicker
                open={openCategory}
                value={category}
                items={categoryItems}
                setOpen={(val) => {
                  setOpenCategory(val);
                  if (val) {
                    setOpenLevel(false);
                    setOpenCountry(false);
                    setOpenCity(false);
                  }
                }}
                setValue={setCategory}
                setItems={setCategories}
                placeholder="All Categories"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: '#fff', fontSize: 15 }}
                arrowIconStyle={{ tintColor: '#fff' }}
                tickIconStyle={{ tintColor: '#fff' }}
                listMode="SCROLLVIEW"
                disabled={loading}
              />
            </View>
          </View>

          {(level === 'country' || level === 'city') && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, zIndex: 2500 }}>
              {/* Country & City dropdowns */}
              {level === 'country' && (
                <View style={{ flex: 1, zIndex: openCountry ? 3100 : 1000 }}>
                  <DropDownPicker
                    open={openCountry}
                    value={country}
                    items={countryItems}
                    setOpen={(val) => {
                      setOpenCountry(val);
                      if (val) {
                        setOpenLevel(false);
                        setOpenCategory(false);
                        setOpenCity(false);
                      }
                    }}
                    setValue={setCountry}
                    setItems={() => {}}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={{ color: '#fff', fontSize: 15 }}
                    arrowIconStyle={{ tintColor: '#fff' }}
                    tickIconStyle={{ tintColor: '#fff' }}
                    listMode="SCROLLVIEW"
                    disabled={loading}
                  />
                </View>
              )}
              {level === 'city' && (
                <>
                  <View style={{ flex: 1, zIndex: openCountry ? 3100 : 1000 }}>
                    <DropDownPicker
                      open={openCountry}
                      value={country}
                      items={countryItems}
                      setOpen={(val) => {
                        setOpenCountry(val);
                        if (val) {
                          setOpenLevel(false);
                          setOpenCategory(false);
                          setOpenCity(false);
                        }
                      }}
                      setValue={setCountry}
                      setItems={() => {}}
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={{ color: '#fff', fontSize: 15 }}
                      arrowIconStyle={{ tintColor: '#fff' }}
                      tickIconStyle={{ tintColor: '#fff' }}
                      listMode="SCROLLVIEW"
                      disabled={loading}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8, zIndex: openCity ? 2800 : 999 }}>
                    <DropDownPicker
                      open={openCity}
                      value={city}
                      items={cityItems}
                      setOpen={(val) => {
                        setOpenCity(val);
                        if (val) {
                          setOpenLevel(false);
                          setOpenCategory(false);
                          setOpenCountry(false);
                        }
                      }}
                      setValue={setCity}
                      setItems={() => {}}
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={{ color: '#fff', fontSize: 15 }}
                      arrowIconStyle={{ tintColor: '#fff' }}
                      tickIconStyle={{ tintColor: '#fff' }}
                      listMode="SCROLLVIEW"
                      disabled={loading}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </>
      )}
      {/* Refresh notice */}
      <TouchableOpacity
        style={styles.refreshNotice}
        activeOpacity={0.8}
        onPress={() => setShowNoticeModal(true)}
      >
        <Text style={styles.refreshText}>
          Leaderboard refreshes every <Text style={styles.refreshHighlight}>Sunday at 19:00</Text>
        </Text>
      </TouchableOpacity>
      {/* Top 3 Users Section (handles ties) */}
      {tab !== 'me' && (
        <View style={styles.topThreeContainer}>
          {[2, 1, 3].map((rank) => {
            const group = topRankGroups[rank];
            if (!group || group.length === 0) return null;

            const firstEntry = group[0];

            // If only one user in that rank, show the avatar
            if (group.length === 1) {
              return (
                <TouchableOpacity
                  key={firstEntry.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedPost({
                      ...firstEntry.post,
                      user: firstEntry.user,
                      rank: firstEntry.rank,
                      level: firstEntry.level,
                      country: level === 'country' || level === 'city' ? country : undefined,
                      city: level === 'city' ? city : undefined,
                    })
                  }
                >
                  <TopUser user={firstEntry} rank={rank} />
                </TouchableOpacity>
              );
            }

            // More than one user share this rank
            return (
              <TouchableOpacity
                key={`group-${rank}`}
                activeOpacity={0.8}
                onPress={() => setSelectedRankPosts({ rank, posts: group })}
              >
                <TopRankGroup rank={rank} count={group.length} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {/* Leaderboard List (only in General tab) */}
      {tab !== 'me' && (
        loading ? (
          <ActivityIndicator color="#00f2ff" size="large" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
            {rest.length === 0 ? (
              <Text style={styles.emptyText}></Text>
            ) : (
              rest.map((entry, idx) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.row}
                  onPress={() =>
                    setSelectedPost({
                      ...entry.post,
                      user: entry.user,
                      rank: entry.rank,
                      level: entry.level,
                      country: level === 'country' || level === 'city' ? country : undefined,
                      city: level === 'city' ? city : undefined,
                    })
                  }
                >
                  {/* Avatar with optional country flag overlay */}
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: entry.user.profileImage }} style={styles.avatar} />
                    {(() => {
                      // Show flag overlay for ranks 4-10 (same logic used for top 3)
                      const flag = getFlag(entry.user.country);
                      return flag && entry.rank <= 10 ? (
                        <Text style={{ position: 'absolute', right: -8, top: -8, fontSize: 20 }}>{flag}</Text>
                      ) : null;
                    })()}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.username}>{entry.user.username}</Text>
                    <Text style={styles.levelCat}>{entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}{entry.category ? ` • ${entry.category.name}` : ''}</Text>
                    <Text style={styles.starCount}>🌟 {entry.post.starCount}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.trophy}>{idx + 3 === 0 ? '🥇' : idx + 3 === 1 ? '🥈' : idx + 3 === 2 ? '🥉' : '🏅'}</Text>
                      <Text style={[styles.place, idx + 3 < 3 && styles.placeTop]}>{getPlaceText(entry.rank)}</Text>
                    </View>
                  </View>
                  <Text style={styles.rank}>{entry.rank}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )
      )}

      {/* Ranked summary for "Me" */}
      {tab === 'me' && (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((rank) => {
            const posts = rankGroups[rank] || [];
            if (posts.length === 0) return null;

            const medal =
              rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString();

            return (
              <TouchableOpacity
                key={rank}
                style={styles.rankRow}
                activeOpacity={0.8}
                onPress={() => setSelectedRankPosts({ rank, posts })}
              >
                <Text style={styles.medal}>{medal}</Text>
                <Text style={styles.rankLabel}>{getPlaceText(rank)}</Text>
                <View style={styles.flexSpacer} />
                <Text style={styles.rankCount}>{posts.length}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modal showing posts for a selected rank */}
      {selectedRankPosts && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBack}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={() => setSelectedRankPosts(null)} style={styles.modalClose}>
                <Icon name="close" size={26} color="#00f2ff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{getPlaceText(selectedRankPosts.rank)} posts</Text>
              <ScrollView>
                {selectedRankPosts.posts.map((entry) => {
                  const media = entry.post.media?.[0];
                  const thumb =
                    media && media.type === 'image'
                      ? { uri: media.url }
                      : { uri: entry.user.profileImage };

                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.postRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedRankPosts(null);
                        setSelectedPost({
                          ...entry.post,
                          user: entry.user,
                          rank: entry.rank,
                          level: entry.level,
                          country: level === 'country' || level === 'city' ? country : undefined,
                          city: level === 'city' ? city : undefined,
                        });
                      }}
                    >
                      <Image source={thumb} style={styles.postThumb} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.modalUsername}>{entry.user.username}</Text>
                        <Text style={styles.modalCaption}>{entry.post.caption || 'Untitled'}</Text>
                        <Text style={styles.starCount}>⭐ {entry.post.starCount}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Notice info modal */}
      {showNoticeModal && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowNoticeModal(false)}
        >
          <TouchableOpacity
            style={styles.noticeModalBack}
            activeOpacity={1}
            onPress={() => setShowNoticeModal(false)}
          >
            <View style={styles.noticeModalContent}>
              <Text style={styles.noticeModalText}>
                What you share during the week is counted until Sunday 19:00.{'\n'}Keep posting and become a Star! ✨
              </Text>
              <TouchableOpacity
                onPress={() => setShowNoticeModal(false)}
                style={styles.noticeModalClose}
              >
                <Icon name="close" size={24} color="#00f2ff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Fixed Share button */}
      {shareAvailable && (
        <TouchableOpacity
          style={styles.shareBtnFixed}
          onPress={openShareModal}
          activeOpacity={0.85}
        >
          <Icon name="share-variant" size={20} color="#181828" />
          <Text style={styles.shareBtnFixedText}>  Share My Rank</Text>
        </TouchableOpacity>
      )}
      {ShareModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101018',
    paddingTop: 60,
    paddingHorizontal: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: '#181828',
    marginHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: '#00f2ff',
  },
  tabLabel: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#101018',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
    zIndex: 3000,
  },
  dropdown: {
    backgroundColor: '#23233a',
    borderColor: '#444',
    borderRadius: 12,
    marginBottom: 0,
    fontSize: 12,
    minHeight: 44,
  },
  dropdownContainer: {
    backgroundColor: '#23233a',
    borderColor: '#555',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    fontSize: 25,
    zIndex: 4000,
  },
  list: {
    flex: 1,
    paddingHorizontal: 0,
    marginTop: 30
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#00f2ff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  levelCat: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  trophy: {
    fontSize: 20,
    marginRight: 6,
  },
  place: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeTop: {
    color: '#FFD700',
  },
  rank: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    marginLeft: 18,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 17,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginHorizontal: 18,
    marginBottom: 30,
    marginTop: 10,
  },
  topUserContainer: {
    alignItems: 'center',
    width: width / 3 - 24,
  },
  crownIcon: {
    marginBottom: 6,
  },
  topUserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 6,
  },
  topUserName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  topUserScore: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 5,
    textAlign: 'center',
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  starCount: {
    color: '#fff',
    fontSize: 18,
    marginTop: 5,
  },
  meRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  meThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  meRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  meRankText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  medal: {
    fontSize: 26,
    width: 40,
    textAlign: 'center',
  },
  rankLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flexSpacer: {
    flex: 1,
  },
  rankCount: {
    color: '#00f2ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  /* Modal */
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    backgroundColor: '#101018',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalTitle: {
    color: '#00f2ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181828',
    borderRadius: 14,
    marginBottom: 14,
    padding: 14,
  },
  postThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  groupBadgeText: {
    color: '#00f2ff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  modalUsername: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  modalCaption: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  shareBtn: {
    alignSelf: 'center',
    backgroundColor: '#00f2ff',
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 30,
  },
  shareBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#101018',
  },
  shareBtnFixed: {
    position: 'absolute',
    bottom: 45,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#00f2ff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    zIndex: 999,
    shadowColor: '#00f2ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderColor: '#fff',
    borderWidth: 4,
  },
  shareBtnFixedText: {
    color: '#181828',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshNotice: {
    backgroundColor: '#00f2ff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshText: {
    color: '#000',
    fontSize: 12,
  },
  refreshHighlight: {
    fontWeight: 'bold',
  },
  noticeModalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeModalContent: {
    width: '90%',
    backgroundColor: '#181828',
    borderRadius: 18,
    padding: 20,
    position: 'relative',
  },
  noticeModalText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  noticeModalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
