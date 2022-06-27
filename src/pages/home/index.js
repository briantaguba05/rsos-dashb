import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import themeConfig from 'src/configs/themeConfig'
import { firebaseAuth, firestore } from 'src/configs/firebase'
import { collection, getDocs, query, where, doc, getDoc, collectionGroup } from 'firebase/firestore'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'

function Dashboard() {
  const [values, setValues] = useState({
    locationPositions: []
  })

  const theme = useTheme()

  useEffect(() => {
    getUserdata()
  }, [])

  async function getUserdata() {
    const q = query(collection(firestore, 'users'), where('auth_uid', '==', firebaseAuth.currentUser.uid))

    await getDocs(q).then(snapshot => {
      snapshot.forEach(async value => {
        if (value.data().role == 'family') {
          await getDoc(doc(firestore, 'users', value.data().riderID)).then(data => {
            if (data.exists()) {
              setValues(prevValues => {
                return {
                  ...prevValues,
                  locationPositions: [
                    {
                      name: data.data().full_name,
                      lat: data.data().location.latitude,
                      lng: data.data().location.longitude
                    }
                  ]
                }
              })
            }
          })
        } else if (value.data().role == 'admin') {
          await getDocs(query(collectionGroup(firestore, 'riders'))).then(data => {
            data.docs.forEach(riderData => {
              if (riderData.exists()) {
                let locations = values.locationPositions

                locations.push({
                  name: riderData.data().full_name,
                  lat: riderData.data().location.latitude,
                  lng: riderData.data().location.longitude
                })

                setValues(prevValues => {
                  return {
                    ...prevValues,
                    locationPositions: locations
                  }
                })
              }
            })
          })
        }
      })
    })
  }

  const mapCenter = {
    lat: 16.4082762,
    lng: 120.6132623
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBB34ej_ByQorE7J9Fb_YHzHYCgwgfscEU'
  })

  const onLoad = React.useCallback(function callback(map) {
    setValues(prevValues => {
      return { ...prevValues, map: map }
    })
  }, [])

  const onUnmount = React.useCallback(function callback(map) {
    setValues(prevValues => {
      return { ...prevValues, map: null }
    })
  }, [])

  return (
    <Grid container spacing={6}>
      <Head>
        <title>{`${themeConfig.templateName} - Home`}</title>
        <meta name='description' content={`${themeConfig.templateName} - Home`} />
        <meta name='keywords' content='RSOS' />
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <Grid item xs={12} md={12} lg={12}>
        <Card>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{
                height: '600px'
              }}
              center={mapCenter}
              zoom={5}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {values.locationPositions != null
                ? values.locationPositions.map((data, index) => {
                    return (
                      <Marker
                        key={`marker-${index}`}
                        label={data.name}
                        position={{
                          lat: data.lat,
                          lng: data.lng
                        }}
                      />
                    )
                  })
                : null}
            </GoogleMap>
          ) : (
            <CircularProgress />
          )}
        </Card>
      </Grid>
    </Grid>
  )
}

export default Dashboard
