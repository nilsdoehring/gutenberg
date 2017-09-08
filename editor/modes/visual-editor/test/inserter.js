/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { VisualEditorInserter } from '../inserter';

describe( 'VisualEditorInserter', () => {
	it( 'should open when receiving focus', () => {
		const wrapper = shallow( <VisualEditorInserter /> );

		wrapper.simulate( 'focus' );

		expect( wrapper.state( 'isOpen' ) ).toBe( true );
	} );

	it( 'should close when losing focus', () => {
		const wrapper = shallow( <VisualEditorInserter /> );

		wrapper.simulate( 'focus' );
		wrapper.simulate( 'blur' );

		expect( wrapper.state( 'isOpen' ) ).toBe( false );
	} );

	it( 'should insert paragraph block', () => {
		const onInsertBlock = jest.fn();
		const wrapper = shallow(
			<VisualEditorInserter onInsertBlock={ onInsertBlock } />
		);

		wrapper
			.findWhere( ( node ) => node.prop( 'children' ) === 'Paragraph' )
			.simulate( 'click' );

		expect( onInsertBlock ).toHaveBeenCalled();
		expect( onInsertBlock.mock.calls[ 0 ][ 0 ].name ).toBe( 'core/paragraph' );
	} );

	it( 'should insert image block', () => {
		const onInsertBlock = jest.fn();
		const wrapper = shallow(
			<VisualEditorInserter onInsertBlock={ onInsertBlock } />
		);

		wrapper
			.findWhere( ( node ) => node.prop( 'children' ) === 'Image' )
			.simulate( 'click' );

		expect( onInsertBlock ).toHaveBeenCalled();
		expect( onInsertBlock.mock.calls[ 0 ][ 0 ].name ).toBe( 'core/image' );
	} );
} );
