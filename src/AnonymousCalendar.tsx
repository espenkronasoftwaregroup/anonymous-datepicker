import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { DateTime, Info } from 'luxon';

export type SimpleCalendarProps = {
  currentMonth?: Date;
  weekdayLabels?: string[];
  localeOverride?: string;
  nextBtnLabel?: string;
  prevBtnLabel?: string;
  onDayClicked?: (date: Date) => void;
};

const getDates = (startingMonth: DateTime, steps: 1 | 0 | -1 = 0): DateTime[] => {
	const monthDate = startingMonth.plus({ months: steps });
	const monthLength = [...Array(monthDate.daysInMonth)];
	const result = monthLength.map((value: number, index: number): DateTime => monthDate.startOf('month').plus({ days: index }));

	result.sort((first: DateTime, second: DateTime): number => {
		if (first > second) return 1;
		if (second > first) return -1;

		return 0;
	});

	return result;
};

const weekStart = (locale: string): string => {
	const parts = locale.match(/^([a-z]{2,3})(?:-([a-z]{3})(?=$|-))?(?:-([a-z]{4})(?=$|-))?(?:-([a-z]{2}|\d{3})(?=$|-))?/i);
	const region = parts![4];
	const language = parts![1];

	const regionSat = 'AEAFBHDJDZEGIQIRJOKWLYOMQASDSY'.match(/../g);
	const regionSun = 'AGARASAUBDBRBSBTBWBZCACNCODMDOETGTGUHKHNIDILINJMJPKEKHKRLAMHMMMOMTMXMZNINPPAPEPHPKPRPTPYSASGSVTHTTTWUMUSVEVIWSYEZAZW'.match(/../g);
	const languageSat = ['ar', 'arq', 'arz', 'fa'];
	const languageSun = 'amasbndzengnguhehiidjajvkmknkolomhmlmrmtmyneomorpapssdsmsnsutatethtnurzhzu'.match(/../g);

	if (region) {
		if (regionSun!.includes(region)) return 'sun';
		if (regionSat!.includes(region)) return 'sat';
	} else {
		if (languageSun!.includes(language)) return 'sun';
		if (languageSat.includes(language)) return 'sat';
	}

	return 'mon';
};

const getDayColumn = (date: DateTime, locale: string): number => {
	const firstDay = weekStart(locale);

	if (firstDay === 'sun') {
		return date.weekday === 1 ? 7 : date.weekday;
	}

	if (firstDay === 'sat') {
		if (date.weekday === 7) return 1;

		return date.weekday + 2;
	}

	return date.weekday;
};

const getWeekDayLabels = (locale: string = window.navigator.language): string[] => {
	const days = Info.weekdays('short');
	const firstDay = weekStart(locale);

	if (firstDay === 'sun') {
		return [days[6], days[0], days[1], days[2], days[3], days[4], days[5]];
	} else if (firstDay === 'sat') {
		return [days[5], days[6], days[0], days[1], days[2], days[3], days[4]];
	}

	return days;
};

function AnonymousCalendar(props: SimpleCalendarProps) : ReactElement {
  const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.now());
  const [dayHovered, setDayHovered] = useState<DateTime | null>(null);
  const [startDate, setStartDate] = useState<DateTime | null>(null);
  const [endDate, setEndDate] = useState<DateTime | null>(null);

  const onMonthScrollClicked = (step: number) : void => setCurrentMonth(currentMonth.plus({month: step}));
  const getCalendarDates = useMemo(() => getDates(currentMonth), [currentMonth]);
  const weekdayLabels = useMemo(() => props.weekdayLabels ?? getWeekDayLabels(props.localeOverride), [props.localeOverride, props.weekdayLabels])

  const getClasses = (value: DateTime): string => {
    let result = 'day';
  
    result += ' grid-column-' + getDayColumn(value, props.localeOverride ?? window.navigator.language);
  
    if (value.hasSame(DateTime.fromJSDate(new Date()), 'day')) {
      result += ' today';
    }

    if (startDate && startDate.hasSame(value, 'day')) {
        result += ' selection-start';
    }

    if (endDate && endDate.hasSame(value, 'day')) {
        result += ' selection-end';
    }

    if (startDate && endDate && value > startDate && value < endDate) {
        result += ' selection';
    }

    if (startDate && dayHovered && !endDate) {
        if (startDate < value && value < dayHovered) {
            result += ' selection';
        } else if (value.hasSame(dayHovered, 'day')) {
            result += ' selection-end';
        }
    }
  
    return result;
  };

  const classCallback = useCallback((day: DateTime) => getClasses(day), [props.localeOverride, startDate, endDate, dayHovered]);

  const onDayClicked = (day: DateTime) : void => {
    if (!startDate && !endDate) {
        setStartDate(day);
        //setDayHovered(day);
    } else if (startDate && !endDate) {
        setEndDate(day);
    } else {
        setStartDate(null);
        setEndDate(null);
    }
  };

  useEffect(() => {
    if (props.currentMonth) {
      setCurrentMonth(DateTime.fromJSDate(props.currentMonth));
    }
  }, [props?.currentMonth]);

  return <div className='calendar-container'>
      <div className='calendar-header'>
        <button className='button-prev' onClick={() => { onMonthScrollClicked(-1); }}>{props?.prevBtnLabel ?? 'Prev'}</button>
        <div className='month-name'>{currentMonth.toLocaleString({ month: 'long' })} {currentMonth.toLocaleString({ year: 'numeric' })}</div>
        <button className='button-next' onClick={() => { onMonthScrollClicked(1); }}>{props?.nextBtnLabel ?? 'Next'}</button>
      </div>
      <div className='month-container'>
        {weekdayLabels.map((weekday: string) : ReactElement => <div key={Math.random()}>{weekday}</div>)}
        {getCalendarDates.map((day: DateTime) : ReactElement => 
          <div className={classCallback(day)}
            data-date={day.toISODate()}
            onMouseOver={() => { if (!dayHovered || dayHovered.hasSame(day, 'day')) {setDayHovered(day)} }}
            onMouseOut={() => { if (dayHovered) { setDayHovered(null) }}}
            key={Math.random()}
            onClick={() => { onDayClicked(day) }}>
            <span><span>{day.day}</span></span>
          </div>
        )}
      </div>
    </div>;
};

export default AnonymousCalendar;