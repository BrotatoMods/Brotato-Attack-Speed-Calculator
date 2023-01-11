/**
 * Brotato Attack Speed Calculator
 *
 * Based on this spreadsheet, which uses data-mined formulas:
 * @link https://docs.google.com/spreadsheets/d/1-EazozRYAORc9TakikmczGy6pNHIT3oTCQE9peuMyB8/edit#gid=1275330995
 *
 * @version 1.0.0
 * @author  Darkly77
 *
 * @todo: Make "max range" disabled if Ranged is active
  */


// Demo Data
import RangedData from './data/ranged.js';
import MeleeData from './data/melee.js';


$( document ).ready( () =>
{
	class Calc
	{
		constructor()
		{
			this.els = {
				$type:     $( '[data-type]' ), // two els (ranged|melee)
				$cooldown: $( '[data-cooldown]' ),
				$recoilr:  $( '[data-recoilr]' ),
				$maxrange: $( '[data-maxrange]' ),
				$result:   $( '[data-result]' ),
				$clear:    $( '[data-clear]' ),
				$demos:    $( '[data-demo]' ),
				$submit:   $( '[data-submit]' ),
			};

			this.setupDemoOptions();
			this.setupDemoHandler();
			this.updateData();
			this.setupFormHandler();
			this.initKeyboardShortcuts();
		}

		updateData()
		{
			this.WPN = {
				type:     this.els.$type.filter( ':checked' ).val(),
				cooldown: this.els.$cooldown.val(),
				recoilr:  this.els.$recoilr.val(),
				maxrange: this.els.$maxrange.val(),
			};

			// Convert to numbers if possible
			this.WPN.cooldown = ( this.WPN.cooldown ) ? parseFloat( this.WPN.cooldown ) : this.WPN.cooldown;
			this.WPN.recoilr  = ( this.WPN.recoilr  ) ? parseFloat( this.WPN.recoilr  ) : this.WPN.recoilr;
			this.WPN.maxrange = ( this.WPN.maxrange ) ? parseFloat( this.WPN.maxrange ) : this.WPN.maxrange;
		}

		setupFormHandler()
		{
			this.els.$submit.on( 'click', () => this.calculate() );

			this.els.$cooldown.on( 'change', () => this.calculate() );
			this.els.$recoilr.on(  'change', () => this.calculate() );
			this.els.$maxrange.on( 'change', () => this.calculate() );

			this.els.$clear.on( 'click',  () => this.reset() );
		}

		calculate()
		{
			this.updateData();

			if ( !this.validate() )
			{
				console.warn( 'Validation error(s). See above' );
				return;
			}

			let theResult = null;

			switch( this.WPN.type )
			{
				case 'melee':
					theResult = this.calculateMelee();
					break;
				case 'ranged':
					theResult = this.calculateRanged();
					break;
			}

			if ( !theResult )
			{
				console.warn( 'ERROR: Result could not be calculated.' );
				return;
			}

			this.els.$result.val( this.roundDecimals( theResult, 2 ) + 's' );
		}

		calculateRanged()
		{
			const WPN    = this.WPN;
			const result = ( WPN.cooldown / 60 ) + ( WPN.recoilr * 2 );

			return result;
		}

		calculateMelee()
		{
			const WPN = this.WPN;

			//@todo: add these as options
			const stat_attack_speed = 0;
			const stat_range        = 0;

			// VIA:
			// src\weapons\weapon_stats\melee_weapon_stats.gd (get_cooldown_text)
			// src\weapons\melee\melee_weapon.gd
			// src\weapons\shooting_behaviors\melee_shooting_data.gd (get_shooting_total_duration)
			//
			// Cooldown Text   = (WPN.cooldown / 60) + WPN.recoil_duration + (atk_duration / 2) + back_duration

			const back_duration = 0.2 / (1 + (stat_attack_speed * 3))
			const distance      = WPN.maxrange + (stat_range / 2);
			const range_factor  = Math.max(0.0, distance / this.clamp(70 * (1 + (stat_attack_speed / 3)), 70, 120));
			const atk_duration  = Math.max(0.01, 0.2 - (stat_attack_speed / 10.0)) + range_factor * 0.15;
			const result        = (WPN.cooldown / 60) + WPN.recoilr + (atk_duration / 2) + back_duration;

			return result;
		}


		/**
		 * Reset all fields
		 *
		 * @return  {void}
		 */
		reset()
		{
			this.setType( 'ranged' );
			this.els.$cooldown.val( '' );
			this.els.$recoilr.val( 0.1 );
			this.els.$maxrange.val( '' );
			this.els.$result.val( '' );
			this.els.$demos.val( 'none' );

			this.els.$cooldown.removeClass( 'field__input--invalid' );
			this.els.$recoilr.removeClass( 'field__input--invalid' );
			this.els.$maxrange.removeClass( 'field__input--invalid' );
		}


		/**
		 * Validate the fields. Logs warnings to the console if issues occur
		 *
		 * @todo: Show validation notice on the frontend
		 *
		 * @return  {bool}  True if fields are valid, otherwise false
		 */
		validate()
		{
			const { type, cooldown, recoilr, maxrange } = this.WPN;

			this.els.$cooldown.removeClass( 'field__input--invalid' );
			this.els.$recoilr.removeClass( 'field__input--invalid' );
			this.els.$maxrange.removeClass( 'field__input--invalid' );

			let errorMsgs = [];

			if ( type !== 'ranged' && type !== 'melee' )
			{
				// This one should never occur
				errorMsgs.push( 'Invalid: Type was neither "ranged" nor "melee".', type );
			}

			if ( cooldown === '' )
			{
				this.els.$cooldown.addClass( 'field__input--invalid' );
				errorMsgs.push( 'Invalid: Cooldown was not set.' );
			}

			if ( recoilr === '' )
			{
				this.els.$recoilr.addClass( 'field__input--invalid' );
				errorMsgs.push( 'Invalid: Recoil Reduction was not set.' );
			}

			if ( type === 'melee' && ( !maxrange || maxrange === '' ) )
			{
				this.els.$maxrange.addClass( 'field__input--invalid' );
				errorMsgs.push( 'Invalid: Range was not set, but is required for melee calculations.' );
			}

			if ( errorMsgs.length )
			{
				errorMsgs.forEach( ( msg ) => console.warn( msg ) );
				return false;
			}

			return true;
		}

		setType( type )
		{
			this.els.$type.filter( '[data-type="melee"]' ).prop( 'checked',  ( type === 'melee' ) ? true : false );
			this.els.$type.filter( '[data-type="ranged"]' ).prop( 'checked', ( type === 'ranged' ) ? true : false );
		}


		// Demos
		// ============================================================================

		setupDemoOptions()
		{
			console.info('RangedData', RangedData); //@debug
			console.info('MeleeData', MeleeData); //@debug

			const demos = {
				'ranged': RangedData,
				'melee': MeleeData
			};

			// Loop over the two types (ranged/melee)
			for (const demoType in demos)
			{
				const demoData = demos[demoType];

				// Loop over data in the demo JS files
				for ( const wpnKey in demoData )
				{
					if ( demoData.hasOwnProperty( wpnKey ) )
					{
						// keys: name, cooldown, maxrange, recoilr
						const wpnData = demoData[wpnKey];
						const wpnName = wpnData.name;
						const $option = `<option value="${wpnKey}">${wpnName} | CD: ${wpnData.cooldown} | MR: ${wpnData.maxrange}</option>`;

						this.els.$demos.filter( `[data-demo="${demoType}"]` ).append( $option );
					}
				}
			}

		}

		setupDemoHandler()
		{
			this.els.$demos.each( ( i, demoEl ) =>
			{
				const $demo = $( demoEl );
				const type = $demo.attr( 'data-demo' );

				$demo.on( 'change', ( ev ) =>
				{
					const currentWpn = $demo.val();

					if ( currentWpn !== 'none' )
					{
						// Get the data, and apply its stats to the fields
						let wpnData = {};
						let $otherDemo;

						switch( type )
						{
							case 'ranged':
								wpnData = RangedData[currentWpn];
								$otherDemo = this.els.$demos.filter( '[data-demo="melee"]' );
								break;
							case 'melee':
								wpnData = MeleeData[currentWpn];
								$otherDemo = this.els.$demos.filter( '[data-demo="ranged"]' );
								break;
						}

						console.log(wpnData);

						// Clear the other demo selection
						$otherDemo.val( 'none' );

						this.setType( wpnData.type );
						this.els.$cooldown.val( wpnData.cooldown );
						this.els.$recoilr.val( wpnData.recoilr );
						this.els.$maxrange.val( wpnData.maxrange );
						this.calculate();
					}
				});
			});
		}


		// Extras
		// ============================================================================

		initKeyboardShortcuts()
		{
			// Note: arrow keys aren't detected on `keypress`
			$( document ).on( 'keydown', ( e ) =>
			{
				// Ignore stuff like "Ctrl+A"
				if ( e.ctrlKey || e.altKey || e.shiftKey )
				{
					return;
				}

				switch( e.code )
				{
					// Arrow keys are disabled because they're used to edit numbers!
					// case 'ArrowLeft':
					// case 'ArrowRight':

					case 'KeyA':
						this.setType( 'ranged' );
						e.preventDefault();
						break;

					case 'KeyD':
						this.setType( 'melee' );
						e.preventDefault();
						break;

					case 'Enter':
					case 'NumpadEnter':
						this.calculate();
				}
			});
		}


		// Utils
		// ============================================================================

		clamp( min, value, max )
		{
			return Math.min( Math.max( value, min ), max );
		}

		/**
		 * Round a number to the specified number of digits (because Math.round doesn't
		 * suport this 🤷‍♂️)
		 *
		 * Warning: `addTrailingDots` returns a string, not a float
		 *
		 * via: https://stackoverflow.com/a/41716722 (with edits to allow any number of decimal places)
		 *
		 * @param  {int}  val  Floating point number (eg 3.14159)
		 * @param  {int}  decimalPlaces  Number of decimal places
		 * @param  {bool} addTrailingDots  True to add trailing dots if there would have been more digits
		 */
		roundDecimals( val, decimalPlaces = 5, addTrailingDots = false )
		{
			// Notes:
			// 1 decimal place  = * 10   -- 10 to the power of 1
			// 2 decimal places = * 100  -- 10 to the power of 2
			// 3 decimal places = * 1000 -- 10 to the power of 3 (`tenPowered` being 1000 in this case)

			const tenPowered = ( Math.pow( 10, decimalPlaces ) ); // "10 to the power of x", x being the exponent)

			let rounded = Math.round( ( Number( val ) + Number.EPSILON ) * tenPowered ) / tenPowered;

			// Original stackoverflow answer (2 decimal places only):
			// Math.round( ( num + Number.EPSILON ) * 100 ) / 100

			if ( addTrailingDots && ( val !== rounded ) )
			{
				rounded += '...';
			}

			return rounded;
		}
	}

	// Init
	const CalcInstance = new Calc();
});
