// pages/api/fetchWeather.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { load } from 'cheerio'
import { fetch } from 'undici'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const location = req.query.location?.toString().toLowerCase()
  if (!location) return res.status(400).json({ error: 'Location is required' })

  const url = `https://www.aajtak.in/weather/${location}-weather-forecast-today`

  try {
    const response = await fetch(url)
    const body = await response.text()
    const $ = load(body)

    const date = $('.wtr_hdr_dte').text()
    const currentTemp = $('.wtr_tmp_rhs strong').text()
    const weatherType = $('.wtr_tmp_txt').text()
    const minTemp = $('.wtr_hdr_rhs_lbl:contains("Min")').siblings('.wtr_hdr_rhs_val').text()
    const maxTemp = $('.wtr_hdr_rhs_lbl:contains("Max")').siblings('.wtr_hdr_rhs_val').text()
    const riseTime = $('.wtr_hdr_rhs_lbl:contains("Rise")').siblings('.wtr_hdr_rhs_val').text()
    const setTime = $('.wtr_hdr_rhs_lbl:contains("Set")').siblings('.wtr_hdr_rhs_val').text()

    const weeklyForecast: { day: string; date: string; temp: string; icon: string; alt: string}[] = []
    $('.wtr_wkl_li.hr_scroll_item').each((_, el) => {
      const day = $(el).find('.wkl_li_day').text()
      const date = $(el).find('.wkl_li_dte').text()
      const temp = $(el).find('.wkl_li_tmp').text()
      const icon = $(el).find('.wkl_li_icn img').attr('src') || ''
      const alt = $(el).find('.wkl_li_icn img').attr('alt') || ''
      weeklyForecast.push({ day, date, temp, icon, alt })
    })
    

    const cards: { title: string; type: string }[] = []
    $('.wtr_crd_li').each((_, el) => {
      const title = $(el).find('.wtr_crd_ttl').text()
      const type = $(el).find('.wtr_crd_txt').text()
      cards.push({ title, type })
    })

    return res.status(200).json({
      current: {date:date, temp: currentTemp, weather: weatherType, min: minTemp, max: maxTemp, rise: riseTime, set: setTime },
      weeklyForecast,
      cards
    })
  } catch (error) {
    console.error('Scraping failed:', error)
    return res.status(500).json({ error: 'Failed to fetch weather data' })
  }
}
